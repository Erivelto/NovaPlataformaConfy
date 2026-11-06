/**
 * Gera src/app/admin/nbs-servicos.ts a partir de scripts/nbs-servicos-source.json
 * Uso: node scripts/build-nbs-servicos.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const srcJson = path.join(root, 'scripts', 'nbs-servicos-source.json');
const outTs = path.join(root, 'src', 'app', 'admin', 'nbs-servicos.ts');

const raw = fs.readFileSync(srcJson, 'utf8');
const j = JSON.parse(raw);
const items = j.servicos || [];
if (!Array.isArray(items) || items.length === 0) {
  console.error('nbs-servicos-source.json: servicos vazio ou invalido');
  process.exit(1);
}

function esc(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let out = `/** Lista NBS / servico nacional (cServTriNational) — gerado por scripts/build-nbs-servicos.mjs */
export interface NbsServico { codigo: string; descricao: string; }

export const NBS_SERVICOS: NbsServico[] = [
`;

for (const s of items) {
  out += `  { codigo: '${esc(s.codigo)}', descricao: '${esc(s.descricao)}' },\n`;
}

out += `];

/** Codigo base na lista (ex.: 6 digitos). */
export function nbsDescricaoPorCodigo(codigo: string | null | undefined): string {
  if (!codigo) return '';
  const d = String(codigo).replace(/\\D/g, '');
  if (!d) return '';
  const hit = NBS_SERVICOS.find((s) => s.codigo === d || d.startsWith(s.codigo));
  return hit ? hit.descricao : '';
}

/** Texto para exibicao: codigo — descricao */
export function nbsRotuloCompleto(codigo: string | null | undefined): string {
  const d = String(codigo ?? '').replace(/\\D/g, '');
  if (!d) return '';
  const hit = NBS_SERVICOS.find((s) => s.codigo === d || d.startsWith(s.codigo));
  const show = hit ? hit.codigo : d;
  const desc = hit ? hit.descricao : '';
  return desc ? \`\${show} — \${desc}\` : show;
}
`;

fs.mkdirSync(path.dirname(outTs), { recursive: true });
fs.writeFileSync(outTs, out, 'utf8');
console.log('Wrote', outTs, 'items', items.length);
