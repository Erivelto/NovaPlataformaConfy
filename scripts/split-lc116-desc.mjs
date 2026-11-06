import fs from 'fs';

const p = new URL('../src/app/admin/lc116-servicos.ts', import.meta.url);
const s = fs.readFileSync(p, 'utf8');

const re = /\{\s*codigo:\s*'([0-9]{6})',\s*rotulo:\s*'((?:\\'|[^'])*)'\s*\}/g;
const items = [];
let m;
while ((m = re.exec(s))) {
  const codigo = m[1];
  let desc = m[2].replace(/\\'/g, "'");
  const strip = new RegExp(`^${codigo}\\s*-\\s*`);
  if (strip.test(desc)) desc = desc.replace(strip, '').trim();
  items.push({ codigo, descricao: desc });
}

function esc(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

let out = `/** Lista LC 116 — codigo (value) e descricao (label). */
export interface Lc116Servico { codigo: string; descricao: string; }

export const LC116_SERVICOS: Lc116Servico[] = [
`;

for (const o of items) {
  out += `  { codigo: '${o.codigo}', descricao: '${esc(o.descricao)}' },\n`;
}

out += `];

export function lc116DescricaoPorCodigo(codigo: string | null | undefined): string {
  if (!codigo) return '';
  const d = String(codigo).replace(/\\D/g, '');
  const six = d.length >= 6 ? d.slice(0, 6) : '';
  const hit = LC116_SERVICOS.find((s) => s.codigo === six);
  return hit ? hit.descricao : '';
}

/** Texto para exibicao: codigo — descricao */
export function lc116RotuloCompleto(codigo: string | null | undefined): string {
  const desc = lc116DescricaoPorCodigo(codigo);
  const six = String(codigo || '').replace(/\\D/g, '').slice(0, 6);
  if (!six) return '';
  return desc ? \`\${six} — \${desc}\` : six;
}
`;

fs.writeFileSync(p, out, 'utf8');
console.log('Wrote', p.pathname, 'items', items.length);
