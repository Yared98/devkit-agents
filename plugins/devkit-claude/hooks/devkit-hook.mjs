#!/usr/bin/env node
// DevKit lifecycle hook, shared by Claude Code, Cursor and Antigravity.
// Usage: node .agents/hooks/devkit-hook.mjs <claude|cursor|antigravity> <session-start|guard|track|stop>
// Reads the tool's JSON on stdin and answers in that tool's format. Always fails open (exit 0, no output).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [tool, event] = process.argv.slice(2);
// Project root: the tool's env var when present (needed when this script runs from a plugin's
// install directory), otherwise two levels above this file (<root>/.agents/hooks/).
const root = path.resolve(process.env.CURSOR_PROJECT_DIR || process.env.CLAUDE_PROJECT_DIR
  || path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
const contextFile = path.join(root, '.devkit', 'context.md');
const stateFile = path.join(root, '.devkit', '.session.json');
const MAX_CONTEXT = 8000;

const DANGEROUS = [
  [/\bgit\s+push\b.*(--force(?!-with-lease)|\s-f(\s|$))/, 'git push forçado'],
  [/\bgit\s+reset\s+--hard\b/, 'git reset --hard'],
  [/\bgit\s+clean\s+-[a-zA-Z]*f/, 'git clean -f'],
  [/\bgit\s+(checkout|restore)\s+(--\s+)?\.(\s|$)/, 'descarte de todas as alterações locais'],
  [/\brm\s+-[a-zA-Z]*r[a-zA-Z]*\s+(-[a-zA-Z]+\s+)*["']?(\/|~|\$HOME|\.git|\*)(["'\s/]|$)/, 'rm recursivo em raiz, home, .git ou curinga'],
  [/\bRemove-Item\b.*-Recurse\b.*(\.git\b|\s[A-Za-z]:\\?(\s|$))/i, 'Remove-Item recursivo em .git ou raiz de disco'],
  [/\bdrop\s+(database|schema)\b/i, 'DROP DATABASE/SCHEMA'],
  [/\btruncate\s+table\b/i, 'TRUNCATE TABLE'],
  [/\bterraform\s+destroy\b/, 'terraform destroy'],
  [/\bkubectl\s+delete\s+(ns|namespace)\b/, 'kubectl delete namespace'],
  [/\bdocker\s+system\s+prune\b/, 'docker system prune'],
];

function readStdin() {
  try {
    const raw = fs.readFileSync(0, 'utf8').replace(/^﻿/, '').trim();
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function reply(obj) {
  if (obj) process.stdout.write(JSON.stringify(obj));
  process.exit(0);
}

function sessionId(input) {
  return String(input.session_id || input.conversation_id || input.conversationId || 'default');
}

function loadState(input) {
  const id = sessionId(input);
  try {
    const s = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    if (s.session === id) return s;
  } catch { /* no state yet */ }
  return { session: id, changed: [], contextUpdated: false, reminded: false };
}

function saveState(state) {
  if (!fs.existsSync(contextFile)) return; // project has not opted into the Context Bank
  fs.writeFileSync(stateFile, JSON.stringify(state));
}

function sessionStart(input) {
  if (!fs.existsSync(contextFile)) return reply();
  saveState({ session: sessionId(input), changed: [], contextUpdated: false, reminded: false });
  let text = fs.readFileSync(contextFile, 'utf8').replace(/^﻿/, '').trim();
  if (text.length > MAX_CONTEXT) text = text.slice(0, MAX_CONTEXT) + '\n[... truncado: leia .devkit/context.md para o restante]';
  const msg = `Context Bank do projeto (.devkit/context.md). Respeite as decisões registradas e não as reabra sem pedido do usuário.\n\n${text}`;
  if (tool === 'claude') return reply({ hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: msg } });
  if (tool === 'cursor') return reply({ additional_context: msg });
  return reply({ injectSteps: [{ systemMessage: { systemMessage: msg } }] });
}

function guard(input) {
  const command = String(input.tool_input?.command ?? input.command ?? input.toolCall?.args?.CommandLine ?? '');
  const hit = DANGEROUS.find(([re]) => re.test(command));
  if (!hit) {
    if (tool === 'cursor') return reply({ permission: 'allow' });
    if (tool === 'antigravity') return reply({ decision: 'allow' });
    return reply();
  }
  const msg = `DevKit: comando destrutivo detectado (${hit[1]}). Confirme com o usuário antes de executar.`;
  if (tool === 'claude') return reply({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'ask', permissionDecisionReason: msg } });
  if (tool === 'cursor') return reply({ continue: true, permission: 'ask', user_message: msg, agent_message: msg });
  return reply({ decision: 'ask', reason: msg });
}

function track(input) {
  // One file per edit event; Cursor's subagentStop reports every file a subagent touched.
  const one = input.tool_input?.file_path ?? input.file_path ?? input.toolCall?.args?.TargetFile;
  const files = [one, ...(Array.isArray(input.modified_files) ? input.modified_files : [])].filter(Boolean);
  if (files.length === 0 || !fs.existsSync(contextFile)) return reply();
  const state = loadState(input);
  for (const file of files) {
    const rel = path.relative(root, path.resolve(root, String(file))).replace(/\\/g, '/');
    if (rel === '.devkit/context.md') state.contextUpdated = true;
    else if (!rel.startsWith('.devkit/') && !rel.startsWith('..') && !/\.(md|mdx|txt)$/i.test(rel) && !state.changed.includes(rel)) {
      state.changed.push(rel);
      state.contextUpdated = false;
      if (state.changed.length > 200) state.changed.shift();
    }
  }
  saveState(state);
  return reply();
}

function stop(input) {
  if (!fs.existsSync(contextFile) || input.stop_hook_active) return reply();
  if (tool === 'cursor' && input.status && input.status !== 'completed') return reply();
  const state = loadState(input);
  if (state.changed.length === 0 || state.contextUpdated || state.reminded) return reply();
  state.reminded = true;
  saveState(state);
  const sample = state.changed.slice(0, 5).join(', ') + (state.changed.length > 5 ? ', ...' : '');
  const msg = `DevKit: ${state.changed.length} arquivo(s) de código alterado(s) nesta sessão (${sample}) e o Context Bank não foi atualizado. Antes de encerrar: (1) se ainda não validou, rode a validação da stack (subagent devkit-validador ou skill tester); (2) registre em .devkit/context.md o estado da camada, decisões e o que falhou (skill contexto). Se nada disso se aplica, apenas conclua.`;
  if (tool === 'claude') return reply({ decision: 'block', reason: msg });
  if (tool === 'cursor') return reply({ followup_message: msg });
  return reply({ decision: 'continue', reason: msg });
}

try {
  const input = readStdin();
  // Cursor also loads Claude Code hooks from .claude/settings.json; .cursor/hooks.json already covers it.
  if (tool === 'claude' && input.cursor_version) reply();
  // Running from a plugin while the project also has the kit installed: the project copy handles it.
  const self = fileURLToPath(import.meta.url);
  const projectCopy = path.join(root, '.agents', 'hooks', 'devkit-hook.mjs');
  if (path.resolve(self) !== path.resolve(projectCopy) && fs.existsSync(projectCopy)) reply();
  ({ 'session-start': sessionStart, guard, track, stop })[event]?.(input);
  reply();
} catch {
  process.exit(0);
}
