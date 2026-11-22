import { LC116_SERVICOS, Lc116Servico } from './lc116-servicos';

export interface CTribMunOpcao {
  /** Três dígitos (cTribMun). */
  value: string;
  label: string;
  codigoNacional: string;
}

export const CTRIBMUN_OMITIR = '__omitir__';

function apenasDigitos(s: string): string {
  return String(s ?? '').replace(/\D/g, '');
}

/** Primeiros 4 dígitos do código nacional (equivalente ao item LC 116, ex. 0106 → 01.06). */
export function prefixoLc116Nacional(codigo6: string): string {
  return apenasDigitos(codigo6).slice(0, 4);
}

/** Os 3 últimos dígitos do cTribNac (6 dígitos) correspondem ao complemento municipal quando a prefeitura adota o padrão nacional. */
export function ctribMunDosUltimosTresDigitos(codigoNacional6: string): string {
  const d = apenasDigitos(codigoNacional6);
  if (d.length !== 6) return '';
  return d.slice(-3).padStart(3, '0');
}

/**
 * Opções de cTribMun para o LC116 nacional selecionado: desdobros (últimos 3 dígitos)
 * de todos os códigos nacionais da mesma subposição (4 primeiros dígitos).
 */
export function opcoesCTribMunPorLc116Nacional(codigoLc116Seis: string): CTribMunOpcao[] {
  const seis = apenasDigitos(codigoLc116Seis);
  const prefix = seis.slice(0, 4);
  if (prefix.length !== 4) return [];

  const porSufixo = new Map<string, CTribMunOpcao>();
  for (const item of LC116_SERVICOS) {
    const cod = apenasDigitos(item.codigo);
    if (cod.length !== 6 || !cod.startsWith(prefix)) continue;
    const value = cod.slice(-3).padStart(3, '0');
    if (!porSufixo.has(value)) {
      porSufixo.set(value, {
        value,
        label: `${value} — ${item.descricao} (cTribNac ${cod})`,
        codigoNacional: cod
      });
    }
  }

  const lista = [...porSufixo.values()].sort((a, b) => a.value.localeCompare(b.value));
  const atual = ctribMunDosUltimosTresDigitos(seis);
  if (atual && !porSufixo.has(atual) && seis.length === 6) {
    const hit = LC116_SERVICOS.find((s: Lc116Servico) => apenasDigitos(s.codigo) === seis);
    lista.unshift({
      value: atual,
      label: `${atual} — ${hit?.descricao ?? 'Código selecionado'} (cTribNac ${seis})`,
      codigoNacional: seis
    });
  }
  return lista;
}