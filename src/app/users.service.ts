import { Injectable } from '@angular/core';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  active: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  getUsers(): User[] {
    const list: User[] = [];
    for (let i = 1; i <= 28; i++) {
      list.push({
        id: i,
        name: `Usuário ${i}`,
        email: `user${i}@example.com`,
        role: i % 4 === 0 ? 'Admin' : 'User',
        active: i % 2 === 0
      });
    }
    return list;
  }
}
