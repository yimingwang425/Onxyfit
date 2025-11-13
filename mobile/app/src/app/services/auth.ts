import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

const TOKEN_KEY = 'auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public tempLoginEmail: string | null = null;

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  login(email: string, password: string): Observable<{ token: string }> {
    console.log(`[Mock Auth] Logging in: ${email}`);
    
    const fakeJwt = 'mock-jwt-' + Date.now();
    this.setToken(fakeJwt);

    try {
      localStorage.setItem('registered_email', email);
    } catch (e) {
      console.warn('failed to set registered_email on login', e);
    }
    
    return of({ token: fakeJwt }).pipe(delay(500));
  }


  logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('registered_email');
      localStorage.removeItem('user_profile');
      localStorage.removeItem('user_avatar');
      localStorage.removeItem('_mock_change_email');
      
      this.tempLoginEmail = null;

    } catch (e) {
      console.warn('logout cleanup failed', e);
    }
  }
}