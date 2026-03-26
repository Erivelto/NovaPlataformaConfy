import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PessoaService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private opts() {
    const token = localStorage.getItem('auth_token');
    return token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};
  }

  // Normaliza PascalCase → camelCase e SIGLAS → minúsculas (ex: CNAE→cnae, CPF→cpf)
  private norm(obj: any): any {
    if (obj == null || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((i: any) => this.norm(i));
    const out: any = {};
    for (const k of Object.keys(obj)) {
      const ck =
        k.length > 1 && k === k.toUpperCase() && /^[A-Z]+$/.test(k)
          ? k.toLowerCase()
          : k.charAt(0).toLowerCase() + k.slice(1);
      out[ck] = this.norm(obj[k]);
    }
    return out;
  }

  getPessoa(codigoPessoa: number): Observable<any> {
    return this.http
      .get<any>(`${this.base}/Pessoa/${codigoPessoa}`, this.opts())
      .pipe(map(r => this.norm(r)));
  }

  getEndereco(codigoPessoa: number): Observable<any> {
    return this.http
      .get<any>(`${this.base}/Endereco/${codigoPessoa}`, this.opts())
      .pipe(map(r => this.norm(r)));
  }

  getRepresentante(codigoPessoa: number): Observable<any> {
    return this.http
      .get<any>(`${this.base}/RepresentanteLegal/Pessoa/${codigoPessoa}`, this.opts())
      .pipe(map(r => this.norm(r)));
  }

  getEnderecoRepresentante(codigoRep: number): Observable<any> {
    return this.http
      .get<any>(`${this.base}/Endereco/RepesentanteLegal/${codigoRep}`, this.opts())
      .pipe(map(r => this.norm(r)));
  }

  getContatos(codigoRep: number): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.base}/Contato?codigoRep=${codigoRep}&val=0`, this.opts())
      .pipe(map(r => this.norm(r)));
  }
}
