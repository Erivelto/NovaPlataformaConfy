import fs from 'fs';
import path from 'path';

const transcriptPath = process.argv[2];
const outPath = process.argv[3] || path.join('src', 'app', 'admin', 'lc116-servicos.ts');

if (!transcriptPath) {
  console.error('Usage: node scripts/gen-lc116-from-transcript.mjs <transcript.jsonl> [output.ts]');
  process.exit(1);
}

const lines = fs.readFileSync(transcriptPath, 'utf8').split(/\n/).filter(Boolean);
let html = '';
for (const line of lines) {
  try {
    const j = JSON.parse(line);
    const text = j?.message?.content?.[0]?.text;
    if (j?.role === 'user' && typeof text === 'string' && text.includes('Segue a lista')) {
      html = text;
      break;
    }
  } catch {
    // skip
  }
}

if (!html) {
  console.error('Could not find user message with list in transcript.');
  process.exit(1);
}

const tdMatches = [...html.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
  m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
);

const opts = [];
for (const t of tdMatches) {
  const mm = t.match(/^(\d{6})\s*-\s*(.+)$/);
  if (mm) opts.push({ codigo: mm[1], rotulo: t });
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let out = `/** Lista LC 116 (itens extraídos da solicitação do usuário). */
export interface Lc116Servico { codigo: string; rotulo: string; }

export const LC116_SERVICOS: Lc116Servico[] = [
`;

for (const o of opts) {
  out += `  { codigo: '${o.codigo}', rotulo: '${esc(o.rotulo)}' },\n`;
}

out += `];

export function lc116RotuloPorCodigo(codigo: string | null | undefined): string {
  if (!codigo) return '';
  const d = String(codigo).replace(/\\D/g, '');
  const six = d.length >= 6 ? d.slice(0, 6) : '';
  const hit = LC116_SERVICOS.find((s) => s.codigo === six);
  return hit ? hit.rotulo : '';
}
`;

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, out, 'utf8');
console.log('Wrote', outPath, 'rows', opts.length);
