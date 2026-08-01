export interface PessoaBase {
  codigo: number;
  documento: string;
  nome: string;
  razao: string;
  dataInclusao: string;
  fisica: boolean;
  numeroWhats?: string;
}

/** Normaliza campos vindos da API (camelCase ou PascalCase). */
export function normalizePessoa(raw: Record<string, unknown>): PessoaBase {
  return {
    codigo: Number(raw['codigo'] ?? raw['Codigo'] ?? 0),
    documento: String(raw['documento'] ?? raw['Documento'] ?? ''),
    nome: String(raw['nome'] ?? raw['Nome'] ?? ''),
    razao: String(raw['razao'] ?? raw['Razao'] ?? ''),
    dataInclusao: String(raw['dataInclusao'] ?? raw['DataInclusao'] ?? ''),
    fisica: Boolean(raw['fisica'] ?? raw['Fisica'] ?? false),
    numeroWhats: (raw['numeroWhats'] ?? raw['NumeroWhats'] ?? undefined) as string | undefined
  };
}

export function resolveCodigoPessoa(item: { codigo?: number; Codigo?: number } | null | undefined): number {
  return Number(item?.codigo ?? item?.Codigo ?? 0);
}

export function rotaEditarCliente(codigo: number): (string | number)[] {
  return ['/administrativo/cliente', codigo, 'editar'];
}
