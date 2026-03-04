import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'authenticationToken';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = environment.apiUrl;
  
  private userIdentity: any = null;
  public tempLoginEmail: string | null = null;

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.API_URL}/authenticate`, credentials).pipe(
      tap((response: any) => {
        const token = response.id_token;
        if (token) {
          this.setToken(token);
          
          if (credentials.username) {
             this.tempLoginEmail = credentials.username;
             localStorage.setItem('registered_email', credentials.username);
          }
        }
      })
    );
  }

  identity(force?: boolean): Observable<any> {
    if (this.userIdentity && !force) {
      return of(this.userIdentity);
    }
    return this.http.get(`${this.API_URL}/account`).pipe(
      tap((account: any) => {
        this.userIdentity = account;
        if (account) {
          localStorage.setItem('current_user_id', account.id);
          localStorage.setItem('current_user_login', account.login);
        }
      })
    );
  }

  setToken(token: string) { 
    localStorage.setItem(TOKEN_KEY, token); 
  }

  getToken(): string | null { 
    return localStorage.getItem(TOKEN_KEY); 
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
  
  get currentUserId(): number | null {
    return this.userIdentity ? this.userIdentity.id : null;
  }

  logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('current_user_id');
      localStorage.removeItem('current_user_login');
      this.userIdentity = null;
      this.tempLoginEmail = null;

      localStorage.removeItem('user_profile');
      localStorage.removeItem('registered_email');
      localStorage.removeItem('user_avatar');
      localStorage.removeItem('has_confirmed_plan_start');
      localStorage.removeItem('_mock_change_email');
      localStorage.removeItem('user_display_name');
      localStorage.removeItem('weight_history');
      localStorage.removeItem('current_ai_plan');
      
      this.router.navigateByUrl('/auth/welcome', { replaceUrl: true });

    } catch (e) {
      console.warn('logout cleanup failed', e);
    }
  }
}