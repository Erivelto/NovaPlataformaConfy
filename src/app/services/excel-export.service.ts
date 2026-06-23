import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';

export interface ExcelExportColumn<T = Record<string, unknown>> {
  key: string;
  title: string;
  format?: (value: unknown, row: T) => string | number | boolean | null | undefined;
}

@Injectable({ providedIn: 'root' })
export class ExcelExportService {
  export<T extends Record<string, unknown>>(
    data: T[],
    columns: ExcelExportColumn<T>[],
    fileName: string
  ): boolean {
    if (!data?.length || !columns?.length) {
      return false;
    }

    const rows = data.map(row => {
      const out: Record<string, string | number | boolean> = {};
      for (const col of columns) {
        const raw = this.getValue(row, col.key);
        const value = col.format ? col.format(raw, row) : this.toCell(raw);
        out[col.title] = value ?? '';
      }
      return out;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

    const safeName = (fileName || 'export').replace(/[^\w\-]+/g, '_');
    XLSX.writeFile(workbook, `${safeName}.xlsx`);
    return true;
  }

  private getValue(obj: Record<string, unknown>, key: string): unknown {
    return key.split('.').reduce<unknown>((acc, part) => {
      if (acc == null || typeof acc !== 'object') return undefined;
      return (acc as Record<string, unknown>)[part];
    }, obj);
  }

  private toCell(value: unknown): string | number | boolean {
    if (value == null) return '';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toLocaleString('pt-BR');
    return JSON.stringify(value);
  }
}
