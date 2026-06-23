export function fmtDate(value: unknown): string {
  if (value == null || value === '') return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
}

export function fmtDateTime(value: unknown): string {
  if (value == null || value === '') return '';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('pt-BR');
}

export function fmtCurrency(value: unknown): string {
  if (value == null || value === '') return '';
  const num = Number(value);
  return Number.isNaN(num) ? String(value) : num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fmtBool(value: unknown): string {
  if (value === true || value === 'true' || value === 1 || value === '1') return 'Sim';
  if (value === false || value === 'false' || value === 0 || value === '0') return 'Não';
  return value == null ? '' : String(value);
}
