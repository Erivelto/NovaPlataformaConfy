/**
 * Gera:
 *   - src/app/admin/lc116-nbs-opcoes.ts   (mapa LC116 6 dígitos -> códigos NBS normalizados)
 *   - src/app/admin/nbs-reforma-catalogo.ts (descrições por código NBS, p/ exibir no select)
 *
 * Fonte: CSV ou planilha (.xls/.xlsx) com colunas tipo "Item LC 116", "NBS", "Descricao NBS",
 * opcionalmente "Todas as NBS do item".
 *
 * Uso:
 *   node scripts/build-lc116-nbs-mapa.mjs [caminho-arquivo]
 *   npm run build:lc116-nbs-mapa
 *
 * Se o caminho não for passado, tenta (nesta ordem):
 *   scripts/reforma_tributaria_contabilin.csv
 *   scripts/reforma_tributaria_contabilin.xls(x)
 *   %USERPROFILE%\Downloads\reforma_tributaria_contabilin_*.csv
 *   primeiro .xls/.xlsx em Downloads que case reforma*tributar* ou *contabilin*
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outMap = path.join(root, 'src', 'app', 'admin', 'lc116-nbs-opcoes.ts');
const outCatalog = path.join(root, 'src', 'app', 'admin', 'nbs-reforma-catalogo.ts');

function esc(s) {
  return String(s ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function onlyDigits(s) {
  return String(s ?? '').replace(/\D/g, '');
}

/**
 * Item LC 116 no CSV: "01.01", 1.01, etc. -> codigo nacional 6 digitos (010101).
 */
function itemLc116ParaSeisDigitos(cell) {
  if (cell == null || cell === '') return '';
  if (typeof cell === 'number' && Number.isFinite(cell)) {
    const t = cell.toFixed(2);
    const m = t.match(/^(\d+)\.(\d{2})$/);
    if (m) return m[1].padStart(2, '0') + m[2] + '01';
  }
  const s = String(cell).trim();
  const m2 = s.match(/^(\d+)\s*\.\s*(\d+)$/);
  if (!m2) return '';
  const a = m2[1].padStart(2, '0');
  const b = m2[2].padStart(2, '0');
  return a + b + '01';
}

/** NBS no CSV com pontos: "1.1502.10.00" -> só dígitos. */
function normalizarCodigoNbs(cell) {
  return onlyDigits(cell);
}

function parseTodasNbsDaCelula(cell) {
  const s = String(cell ?? '').trim();
  if (!s) return [];
  const out = [];
  const re = /\d(?:[\d.]*\d|\d)/g;
  let m;
  while ((m = re.exec(s)) !== null) {
    const d = onlyDigits(m[0]);
    if (d.length >= 6) out.push(d);
  }
  return out;
}

function findInputPath(argvPath) {
  const candidates = [
    argvPath,
    path.join(root, 'scripts', 'reforma_tributaria_contabilin.csv'),
    path.join(root, 'scripts', 'reforma_tributaria_contabilin.xls'),
    path.join(root, 'scripts', 'reforma_tributaria_contabilin.xlsx'),
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  const home = process.env.USERPROFILE || process.env.HOME;
  const downloads = home ? path.join(home, 'Downloads') : '';
  if (!downloads || !fs.existsSync(downloads)) return null;

  let files = [];
  try {
    files = fs.readdirSync(downloads);
  } catch {
    return null;
  }

  const csvMatch = files.find(
    (f) =>
      /^reforma_tributaria_contabilin.*\.csv$/i.test(f) ||
      (/reforma/i.test(f) && /tribut/i.test(f) && f.toLowerCase().endsWith('.csv'))
  );
  if (csvMatch) return path.join(downloads, csvMatch);

  const xMatch = files.find(
    (f) =>
      /\.xlsx?$/i.test(f) &&
      ((/reforma/i.test(f) && /tribut/i.test(f)) || /contabilin/i.test(f))
  );
  if (xMatch) return path.join(downloads, xMatch);

  return null;
}

/**
 * @param {string[][]} rows
 * @returns {{ lc116: string, nbs: string }[]}
 */
function extractFromRows(rows) {
  const pairs = [];
  if (!rows?.length) return pairs;

  let lcCol = -1;
  let nbsCol = -1;
  let descCol = -1;
  let todasCol = -1;
  let headerRow = -1;

  for (let r = 0; r < Math.min(20, rows.length); r++) {
    const row = rows[r] || [];
    for (let c = 0; c < row.length; c++) {
      const h = String(row[c] ?? '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      if (/item\s+lc\s*116|lc\s*116|lc116/.test(h)) lcCol = c;
      if (/^nbs$|^cod.*nbs/.test(h) && !h.includes('todas')) nbsCol = c;
      if (/descricao\s+nbs|descripcao\s+nbs/.test(h) || /^descricao nbs$/.test(h)) descCol = c;
      if (/todas\s+as\s+nbs|todas\s+nbs/.test(h)) todasCol = c;
    }
    if (lcCol >= 0 && nbsCol >= 0) {
      headerRow = r;
      break;
    }
  }

  if (lcCol < 0 || nbsCol < 0 || headerRow < 0) {
    console.warn('Cabecalho LC116/NBS nao encontrado; tentando inferencia por linha.');
    return inferPairsFromRows(rows);
  }

  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const lc = itemLc116ParaSeisDigitos(row[lcCol]);
    const nbsMain = normalizarCodigoNbs(row[nbsCol]);
    const desc = descCol >= 0 ? String(row[descCol] ?? '').trim() : '';

    if (lc.length !== 6) continue;

    if (nbsMain.length >= 6) {
      pairs.push({ lc116: lc, nbs: nbsMain, desc });
    }
    if (todasCol >= 0) {
      for (const x of parseTodasNbsDaCelula(row[todasCol])) {
        if (x.length >= 6 && x !== nbsMain) pairs.push({ lc116: lc, nbs: x, desc: '' });
      }
    }
  }
  return pairs;
}

function inferPairsFromRows(rows) {
  const pairs = [];
  for (const row of rows) {
    if (!row?.length) continue;
    const tokens = [];
    for (const cell of row) {
      const d = onlyDigits(cell);
      if (d.length >= 6) tokens.push(d);
    }
    if (tokens.length < 2) continue;
    const six = tokens.find((t) => t.length === 6);
    if (!six) continue;
    for (const t of tokens) {
      if (t === six) continue;
      if (t.length >= 6) pairs.push({ lc116: six, nbs: t, desc: '' });
    }
  }
  return pairs;
}

/** CSV simples com aspas (RFC básico). */
function parseCsvRows(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = [];
  let i = 0;
  let cur = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      cur += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ',') {
      row.push(cur);
      cur = '';
      i++;
      continue;
    }
    if (c === '\r') {
      i++;
      continue;
    }
    if (c === '\n') {
      row.push(cur);
      lines.push(row);
      row = [];
      cur = '';
      i++;
      continue;
    }
    cur += c;
    i++;
  }
  if (cur.length || row.length) {
    row.push(cur);
    lines.push(row);
  }
  return lines;
}

function readRowsFromFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.csv') {
    return parseCsvRows(filePath);
  }
  const wb = XLSX.readFile(filePath);
  const all = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
    console.log('Sheet', name, 'rows:', rows.length);
    all.push(...rows);
  }
  return all;
}

function buildMapAndCatalog(pairs) {
  /** @type {Record<string, Set<string>>} */
  const map = {};
  /** @type {Record<string, string>} */
  const catalog = {};

  for (const { lc116, nbs, desc } of pairs) {
    if (!map[lc116]) map[lc116] = new Set();
    map[lc116].add(nbs);
    if (desc && desc.trim()) {
      if (!catalog[nbs]) catalog[nbs] = desc.trim();
    }
  }
  return { map, catalog };
}

function writeMapTs(map) {
  const keys = Object.keys(map).sort();
  let body = `/** Mapa LC116 (6 digitos) -> codigos NBS (normalizados, apenas digitos) — gerado por scripts/build-lc116-nbs-mapa.mjs */
export const LC116_PARA_CODIGOS_NBS: Record<string, string[]> = {\n`;

  for (const k of keys) {
    const arr = [...map[k]].sort();
    const inner = arr.map((x) => `'${esc(x)}'`).join(', ');
    body += `  '${esc(k)}': [${inner}],\n`;
  }
  body += `};

export function codigosNbsPermitidosParaLc116(codigoLc116: string | null | undefined): string[] | null {
  const raw = String(codigoLc116 ?? '').replace(/\\D/g, '');
  if (!raw) return null;
  const six = raw.length >= 6 ? raw.slice(0, 6) : raw.padStart(6, '0');
  if (!/^\\d{6}$/.test(six)) return null;
  const list = LC116_PARA_CODIGOS_NBS[six];
  if (!list || !list.length) return null;
  return list;
}

/**
 * Codigo NBS salvo (apenas digitos) compativel com a lista permitida do LC116.
 */
export function codigoNbsPermitidoParaLc116(
  codigoLc116: string | null | undefined,
  codigoNbs: string | null | undefined
): boolean {
  const allowed = codigosNbsPermitidosParaLc116(codigoLc116);
  if (!allowed) return true;
  const d = String(codigoNbs ?? '').replace(/\\D/g, '');
  if (!d) return false;
  return allowed.some((p) => {
    const pd = String(p).replace(/\\D/g, '');
    if (!pd) return false;
    return d === pd || d.startsWith(pd) || pd.startsWith(d);
  });
}
`;
  fs.mkdirSync(path.dirname(outMap), { recursive: true });
  fs.writeFileSync(outMap, body, 'utf8');
}

function writeCatalogTs(catalog) {
  const keys = Object.keys(catalog).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  let body = `/** Descricoes NBS (reforma / tabela Contabilin) — gerado por scripts/build-lc116-nbs-mapa.mjs */
export const NBS_REFORMA_DESCRICAO_POR_CODIGO: Record<string, string> = {\n`;
  for (const k of keys) {
    body += `  '${esc(k)}': '${esc(catalog[k])}',\n`;
  }
  body += `};

export function descricaoNbsReforma(codigoNormalizado: string | null | undefined): string {
  const d = String(codigoNormalizado ?? '').replace(/\\D/g, '');
  if (!d) return '';
  if (NBS_REFORMA_DESCRICAO_POR_CODIGO[d]) return NBS_REFORMA_DESCRICAO_POR_CODIGO[d];
  const keys = Object.keys(NBS_REFORMA_DESCRICAO_POR_CODIGO).sort((a, b) => b.length - a.length);
  for (const p of keys) {
    if (d.startsWith(p) || p.startsWith(d)) return NBS_REFORMA_DESCRICAO_POR_CODIGO[p];
  }
  return '';
}

/** Rotulo para revisao: codigo (digitos) — descricao */
export function nbsRotuloReformaCompleto(codigo: string | null | undefined): string {
  const d = String(codigo ?? '').replace(/\\D/g, '');
  if (!d) return '';
  const desc = descricaoNbsReforma(d);
  return desc ? \`\${d} — \${desc}\` : d;
}
`;
  fs.writeFileSync(outCatalog, body, 'utf8');
}

const inputPath = findInputPath(process.argv[2]);

if (!inputPath) {
  console.warn(
    'Arquivo nao encontrado. Copie o CSV para scripts/reforma_tributaria_contabilin.csv ou passe o caminho.\n' +
      'Gerando arquivos vazios (NBS sem filtro ate haver mapa).'
  );
  writeMapTs({});
  writeCatalogTs({});
  console.log('Wrote empty', outMap, outCatalog);
  process.exit(0);
}

const rows = readRowsFromFile(inputPath);
const pairs = extractFromRows(rows);
console.log('Linhas:', rows.length, 'pares LC116+NBS:', pairs.length, 'de', inputPath);

const { map, catalog } = buildMapAndCatalog(pairs);
writeMapTs(map);
writeCatalogTs(catalog);
console.log('Wrote', outMap, 'LC116 keys:', Object.keys(map).length);
console.log('Wrote', outCatalog, 'NBS catalogo:', Object.keys(catalog).length);
