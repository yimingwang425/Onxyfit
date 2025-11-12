import { Injectable } from '@angular/core';

const TOKEN_KEY = 'auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('registered_email');
      localStorage.removeItem('user_profile');
      localStorage.removeItem('user_avatar');
      localStorage.removeItem('_mock_change_email');
    } catch (e) {
      console.warn('logout cleanup failed', e);
    }
  }
}
