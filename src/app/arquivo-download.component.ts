import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzResultModule } from 'ng-zorro-antd/result';
import { ArquivoService } from './services/arquivo.service';

@Component({
  selector: 'app-arquivo-download',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NzSpinModule, NzResultModule],
  template: `
    <div class="wrap">
      @if (erro) {
        <nz-result nzStatus="error" nzTitle="Link inválido" [nzSubTitle]="erro" />
      } @else {
        <nz-spin nzSimple nzSize="large" />
        <p>Preparando download do arquivo...</p>
      }
    </div>
  `,
  styles: [`
    .wrap {
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 24px;
      color: rgba(0, 0, 0, 0.65);
    }
  `]
})
export class ArquivoDownloadComponent implements OnInit {
  erro = '';

  constructor(
    private route: ActivatedRoute,
    private arquivoService: ArquivoService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const diretorioCompleto = params.get('diretorioCompleto');
    const nomeArquivo = params.get('nomeArquivo');
    const tipo = params.get('tipo') || '';

    if (!diretorioCompleto?.trim() || !nomeArquivo?.trim()) {
      this.erro = 'Parâmetros diretorioCompleto e nomeArquivo são obrigatórios.';
      return;
    }

    this.arquivoService.abrir(diretorioCompleto, nomeArquivo, tipo);
  }
}
