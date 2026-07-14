import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { LEAD_WHATSAPP } from './site.constants';
import { CadastroInicialPayload } from './contratacao.service';

export interface PessoaAplicativoPayload {
  CodigoPessoa: number;
  DataCadastro: string;
  DataEnvio: string;
  Erro: string;
  Mensagem: string;
  NomeDestinatario: string;
  NumeroDestinatario: string;
  NumeroRemetente: string;
  StatusSMS: string;
  TipoAplicativo: string;
}

export type TipoSolicitacaoLead = 'abertura' | 'mudanca';

@Injectable({ providedIn: 'root' })
export class PessoaAplicativoService {
  private readonly url = `${environment.apiUrl}/PessoaAplicativo`;

  constructor(private http: HttpClient) {}

  enviarMensagemLead(
    tipo: TipoSolicitacaoLead,
    dados: CadastroInicialPayload,
    nomeCampoLabel: string,
  ): Observable<unknown> {
    const agora = new Date().toISOString();
    const payload: PessoaAplicativoPayload = {
      CodigoPessoa: LEAD_WHATSAPP.codigoPessoa,
      DataCadastro: agora,
      DataEnvio: agora,
      Erro: '',
      Mensagem: this.montarMensagem(tipo, dados, nomeCampoLabel),
      NomeDestinatario: LEAD_WHATSAPP.nomeDestinatario,
      NumeroDestinatario: LEAD_WHATSAPP.numeroDestinatario,
      NumeroRemetente: LEAD_WHATSAPP.numeroRemetente,
      StatusSMS: 'Pendente',
      TipoAplicativo: 'Whatsapp',
    };

    return this.http.post(this.url, payload);
  }

  private montarMensagem(
    tipo: TipoSolicitacaoLead,
    dados: CadastroInicialPayload,
    nomeCampoLabel: string,
  ): string {
    const servico =
      tipo === 'abertura' ? 'Solicitação de abertura de empresa' : 'Solicitação de mudança de contador';

    const linhas = [
      'Novo lead do site Contfy',
      `Serviço: ${servico}`,
    ];

    if (dados.cnpj?.trim()) {
      linhas.push(`CNPJ: ${dados.cnpj.trim()}`);
    }

    linhas.push(
      `${nomeCampoLabel}: ${dados.nome.trim()}`,
      `E-mail: ${dados.email.trim()}`,
      `Celular/WhatsApp: ${dados.celular.trim()}`,
      `Plano: ${dados.plano}`,
      'Origem: Site institucional',
    );

    return linhas.join('\n');
  }
}
