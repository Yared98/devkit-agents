#!/usr/bin/env node
// Installs the DevKit into another project.
// Usage: node scripts/install.mjs <pasta-do-projeto> [--tools claude,cursor,antigravity] [--force]
// Never overwrites AGENTS.md, CLAUDE.md, .devkit/* or an existing hooks/settings file unless --force is given.
import fs from 'node:fs';
import path from 'node:path';
import { generate, kitRoot } from './sync.mjs';

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith('--'));
if (!target || !fs.existsSync(target)) {
  console.error('Uso: node scripts/install.mjs <pasta-do-projeto> [--tools claude,cursor,antigravity] [--force]');
  process.exit(1);
}
const force = args.includes('--force');
const toolsArg = args[args.indexOf('--tools') + 1];
const tools = new Set((args.includes('--tools') && toolsArg ? toolsArg : 'claude,cursor,antigravity').split(',').map((t) => t.trim()));
for (const t of tools) if (!['claude', 'cursor', 'antigravity'].includes(t)) { console.error(`Ferramenta desconhecida: ${t}`); process.exit(1); }

const dest = path.resolve(target);
const log = [];
const put = (rel, buf, { keep = false } = {}) => {
  const full = path.join(dest, rel);
  if (keep && fs.existsSync(full) && !force) { log.push(`mantido (já existe): ${rel}`); return false; }
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, buf);
  return true;
};
const fromKit = (rel) => fs.readFileSync(path.join(kitRoot, rel));
const copyTree = (rel) => {
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(kitRoot, rel))) put(path.relative(kitRoot, f), fs.readFileSync(f));
};

const generated = generate();
const wanted = [];
if (tools.has('claude')) wanted.push('.claude/skills/', '.claude/agents/');
if (tools.has('cursor')) wanted.push('.cursor/agents/');
if (tools.has('antigravity')) wanted.push('.agents/agents/');
for (const [rel, buf] of generated) if (wanted.some((p) => rel.startsWith(p))) put(rel, buf);

if (tools.has('cursor') || tools.has('antigravity')) copyTree('.agents/skills');
put('.agents/hooks/devkit-hook.mjs', fromKit('.agents/hooks/devkit-hook.mjs'));
if (tools.has('claude')) put('.claude/settings.json', fromKit('.claude/settings.json'), { keep: true }) || log.push('  -> junte manualmente o bloco "hooks" de .claude/settings.json do DevKit');
if (tools.has('cursor')) put('.cursor/hooks.json', fromKit('.cursor/hooks.json'), { keep: true }) || log.push('  -> junte manualmente os hooks de .cursor/hooks.json do DevKit');
if (tools.has('antigravity')) put('.agents/hooks.json', fromKit('.agents/hooks.json'), { keep: true }) || log.push('  -> junte manualmente a chave "devkit" de .agents/hooks.json do DevKit');

put('AGENTS.md', fromKit('kit/templates/AGENTS.md'), { keep: true }) || log.push('  -> copie para o seu AGENTS.md a seção de kit/templates/AGENTS.md');
if (tools.has('claude')) put('CLAUDE.md', Buffer.from('@AGENTS.md\n'), { keep: true }) || log.push('  -> garanta que o seu CLAUDE.md contenha a linha @AGENTS.md');
put('.devkit/config.md', fromKit('kit/templates/config.md'), { keep: true });
put('.devkit/brand.md', fromKit('kit/templates/brand.md'), { keep: true });

const gi = path.join(dest, '.gitignore');
const giText = fs.existsSync(gi) ? fs.readFileSync(gi, 'utf8') : '';
if (!giText.includes('.devkit/.session.json')) fs.writeFileSync(gi, giText + (giText && !giText.endsWith('\n') ? '\n' : '') + '.devkit/.session.json\n');

console.log(`DevKit instalado em ${dest} para: ${[...tools].join(', ')}`);
if (log.length) console.log(log.join('\n'));
console.log('Próximo passo: edite .devkit/config.md e, na ferramenta, rode /orquestrador (ou peça a skill contexto) para criar o Context Bank.');
