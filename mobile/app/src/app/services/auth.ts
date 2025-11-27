import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { delay } from 'rxjs/operators';
import { Router } from '@angular/router';

const TOKEN_KEY = 'authenticationToken';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private resourceUrl = '/api/authenticate';
  private accountUrl = '/api/account';
  private userIdentity: any = null;
  public tempLoginEmail: string | null = null;
  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: any): Observable<any> {
    return this.http.post(this.resourceUrl, credentials).pipe(
      tap((response: any) => {
        const token = response.id_token;
        if (token) {
          this.setToken(token);
          if (credentials.username){
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
    return this.http.get(this.accountUrl).pipe(
      tap((account: any) => {
        this.userIdentity = account;
        localStorage.setItem('current_user_id', account.id);
        localStorage.setItem('current_user_login', account.login);
      })
    );
  }

  setToken(token: string) { localStorage.setItem(TOKEN_KEY, token); }
  getToken(): string | null { return localStorage.getItem(TOKEN_KEY); }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);

      localStorage.removeItem('current_user_id');
      localStorage.removeItem('current_user_login');
      this.userIdentity = null;
      this.tempLoginEmail = null;

      localStorage.removeItem('registered_email');
      localStorage.removeItem('user_profile');
      localStorage.removeItem('user_avatar');
      localStorage.removeItem('_mock_change_email');
      
      localStorage.removeItem('has_confirmed_plan_start');
      
      this.tempLoginEmail = null;
      
      this.router.navigateByUrl('/auth/welcome', { replaceUrl: true });

    } catch (e) {
      console.warn('logout cleanup failed', e);
    }
  }
}