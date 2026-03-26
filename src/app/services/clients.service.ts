import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Client { id?: number; name: string; email?: string; phone?: string }

@Injectable({ providedIn: 'root' })
export class ClientsService {
  // configure the webhook URL after importing/activating the workflow in n8n
  private webhookUrl = 'http://localhost:5678/webhook/<workflowId>/clients';

  constructor(private http: HttpClient) {}

  // list all clients (wrapper POST to webhook)
  list(): Observable<Client[]> {
    return this.http.post<Client[]>(this.webhookUrl, {});
  }

  // create client
  create(client: Client): Observable<Client> {
    return this.http.post<Client>(this.webhookUrl, client);
  }

  // delete client by id
  delete(id: number): Observable<any> {
    return this.http.post(this.webhookUrl, { id, _action: 'delete' });
  }
}
