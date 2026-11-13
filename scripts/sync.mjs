#!/usr/bin/env node
// Generates the per-tool files from the single sources of truth:
//   .agents/skills/**  -> .claude/skills/**   (Cursor and Antigravity read .agents/skills natively)
//   kit/agents/*.md    -> .claude/agents, .cursor/agents, .agents/agents
// Usage: node scripts/sync.mjs          write generated files
//        node scripts/sync.mjs --check  exit 1 if generated files are stale
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const kitRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const GENERATED_DIRS = ['.claude/skills', '.claude/agents', '.cursor/agents', '.agents/agents', 'plugins/devkit'];

const norm = (s) => s.replace(/^﻿/, '').replace(/\r\n/g, '\n');
const readJson = (p) => JSON.parse(norm(fs.readFileSync(path.join(kitRoot, p), 'utf8')));

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full, base) : [path.relative(base, full).replace(/\\/g, '/')];
  });
}

function splitFrontmatter(text) {
  const m = norm(text).match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) throw new Error('arquivo sem frontmatter');
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { raw: m[1], data, body: norm(text).slice(m[0].length) };
}

const yamlValue = (v) => (typeof v === 'string' && /[:#\[\]{}]|^\s|\s$/.test(v) ? JSON.stringify(v) : v);
const frontmatter = (pairs) => `---\n${pairs.filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => `${k}: ${yamlValue(v)}`).join('\n')}\n---\n`;

const CLAUDE_TOOLS = { read: 'Read, Grep, Glob', exec: 'Read, Grep, Glob, Bash, PowerShell, Skill', write: undefined };
const ANTIGRAVITY_TOOLS = {
  read: ['view_file', 'list_dir', 'find_by_name', 'grep_search'],
  exec: ['view_file', 'list_dir', 'find_by_name', 'grep_search', 'run_command'],
  write: ['view_file', 'list_dir', 'find_by_name', 'grep_search', 'run_command', 'write_to_file', 'replace_file_content', 'multi_replace_file_content'],
};

/** Returns Map<relative path, Buffer> with every generated file. */
export function generate() {
  const out = new Map();
  const models = readJson('kit/models.json');
  const overrides = readJson('kit/claude-skill-overrides.json');

  const skillsDir = path.join(kitRoot, '.agents', 'skills');
  for (const rel of walk(skillsDir)) {
    const [skill, ...rest] = rel.split('/');
    let buf = fs.readFileSync(path.join(skillsDir, rel));
    if (rest.join('/') === 'SKILL.md') {
      const { raw, data, body } = splitFrontmatter(buf.toString('utf8'));
      if (data.name !== skill) throw new Error(`${rel}: name "${data.name}" difere da pasta "${skill}"`);
      if (!data.description) throw new Error(`${rel}: sem description`);
      const extra = Object.entries(overrides[skill] ?? {}).map(([k, v]) => `${k}: ${yamlValue(v)}`);
      buf = Buffer.from(`---\n${[raw, ...extra].join('\n')}\n---\n${body}`);
    }
    out.set(`.claude/skills/${rel}`, buf);
    out.set(`plugins/devkit/skills/${rel}`, fs.readFileSync(path.join(skillsDir, rel)));
  }

  // Cursor plugin (standard layout: skills/, agents/, hooks/hooks.json), listed in .cursor-plugin/marketplace.json
  const read = (p) => fs.readFileSync(path.join(kitRoot, p));
  out.set('plugins/devkit/.cursor-plugin/plugin.json', read('kit/cursor-plugin/plugin.json'));
  out.set('plugins/devkit/hooks/hooks.json', read('kit/cursor-plugin/hooks.json'));
  out.set('plugins/devkit/hooks/devkit-hook.mjs', read('.agents/hooks/devkit-hook.mjs'));

  const agentsDir = path.join(kitRoot, 'kit', 'agents');
  for (const file of fs.readdirSync(agentsDir).filter((f) => f.endsWith('.md'))) {
    const { data, body } = splitFrontmatter(fs.readFileSync(path.join(agentsDir, file), 'utf8'));
    const { name, description, tier = 'standard', access = 'write', skills } = data;
    if (!name || !description || !models[tier] || !(access in CLAUDE_TOOLS)) throw new Error(`kit/agents/${file}: frontmatter inválido`);
    for (const s of (skills ?? '').split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!fs.existsSync(path.join(skillsDir, s, 'SKILL.md'))) throw new Error(`kit/agents/${file}: skill "${s}" não existe`);
    }
    const note = `<!-- Gerado por scripts/sync.mjs a partir de kit/agents/${file}. Não edite aqui. -->\n`;
    const m = models[tier];
    out.set(`.claude/agents/${file}`, Buffer.from(frontmatter([['name', name], ['description', description], ['model', m.claude], ['tools', CLAUDE_TOOLS[access]], ['skills', skills]]) + note + body));
    for (const dir of ['.cursor/agents', 'plugins/devkit/agents']) out.set(`${dir}/${file}`, Buffer.from(frontmatter([['name', name], ['description', description], ['model', m.cursor], ['readonly', access === 'read' ? 'true' : undefined]]) + note + body));
    out.set(`.agents/agents/${file}`, Buffer.from(frontmatter([['name', name], ['description', description], ['model', m.antigravity], ['mainAgent', 'false'], ['subagent', 'true'], ['tools', `[${ANTIGRAVITY_TOOLS[access].join(', ')}]`]]).replace(/tools: "(\[.*\])"/, 'tools: $1') + note + body));
  }
  return out;
}

function main() {
  const check = process.argv.includes('--check');
  const files = generate();
  const problems = [];
  for (const [rel, buf] of files) {
    const full = path.join(kitRoot, rel);
    // Compare ignoring CRLF/LF so a Windows checkout with core.autocrlf does not look stale.
    const lf = (b) => b.toString('latin1').replace(/\r\n/g, '\n');
    const same = fs.existsSync(full) && lf(fs.readFileSync(full)) === lf(buf);
    if (same) continue;
    if (check) problems.push(`desatualizado: ${rel}`);
    else { fs.mkdirSync(path.dirname(full), { recursive: true }); fs.writeFileSync(full, buf); }
  }
  for (const dir of GENERATED_DIRS) {
    for (const rel of walk(path.join(kitRoot, dir))) {
      const key = `${dir}/${rel}`;
      if (files.has(key)) continue;
      if (check) problems.push(`sobrando: ${key}`);
      else fs.unlinkSync(path.join(kitRoot, key));
    }
  }
  if (problems.length) { console.error(problems.join('\n') + '\n\nRode: node scripts/sync.mjs'); process.exit(1); }
  console.log(`${check ? 'OK' : 'Gerado'}: ${files.size} arquivos em ${GENERATED_DIRS.join(', ')}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
