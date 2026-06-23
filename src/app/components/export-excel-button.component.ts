import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ExcelExportColumn, ExcelExportService } from '../services/excel-export.service';

@Component({
  selector: 'app-export-excel-button',
  standalone: true,
  imports: [CommonModule, NzButtonModule, NzIconModule],
  template: `
    <button
      nz-button
      nzType="primary"
      nzSize="small"
      class="export-excel-btn"
      [disabled]="disabled || loading || !data.length"
      (click)="exportar()">
      <i nz-icon nzType="download"></i>
      {{ label }}
    </button>
  `,
  styles: [`
    .export-excel-btn { background: #217346; border-color: #217346; }
    .export-excel-btn:hover:not([disabled]), .export-excel-btn:focus:not([disabled]) {
      background: #1a5c38; border-color: #1a5c38; color: #fff;
    }
  `]
})
export class ExportExcelButtonComponent {
  @Input() data: Record<string, unknown>[] = [];
  @Input() columns: ExcelExportColumn<any>[] = [];
  @Input() fileName = 'export';
  @Input() label = 'Exportar Excel';
  @Input() disabled = false;
  @Input() loading = false;

  constructor(
    private excelExport: ExcelExportService,
    private message: NzMessageService
  ) {}

  exportar(): void {
    if (!this.data?.length) {
      this.message.warning('Não há dados para exportar.');
      return;
    }
    if (!this.columns?.length) {
      this.message.error('Colunas de exportação não configuradas.');
      return;
    }
    const ok = this.excelExport.export(this.data, this.columns, this.fileName);
    if (ok) {
      this.message.success('Arquivo Excel gerado com sucesso.');
    } else {
      this.message.error('Não foi possível exportar os dados.');
    }
  }
}
