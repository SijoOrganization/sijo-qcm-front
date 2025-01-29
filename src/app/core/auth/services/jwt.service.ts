import { Injectable } from '@angular/core';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  getUser(): User | null {
    if (window.localStorage['user']) {
      return JSON.parse(window.localStorage['user']);
    }
    return null;
  }

  saveUser(user: User): void {
    window.localStorage["user"] = JSON.stringify(user);
  }

  destroyUser(): void {
    window.localStorage.removeItem("user");
  }
}
