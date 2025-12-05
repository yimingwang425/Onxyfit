import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  email$ = new BehaviorSubject<string>('');
  tempToken$ = new BehaviorSubject<string | null>(null);

  tempPassword?: string;

  private useMock = false;

  private API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  setEmail(email: string) { this.email$.next(email); }

  sendOtp(email: string): Observable<any> {
    this.setEmail(email);
    if (this.useMock) {
      return of({ message: 'otp_sent', expiresIn: 600 }).pipe(delay(700));
    } else {
      return this.http.post(`${this.API_URL}/register/send-otp`, { email });
    }
  }

  verifyOtp(email: string, otp: string): Observable<any> {
    if (this.useMock) {
      const fake = 'mock-temp-' + Date.now();
      this.tempToken$.next(fake);
      return of({ verified: true, tempToken: fake }).pipe(delay(500));
    } else {
      return this.http.post(`${this.API_URL}/register/verify-otp`, { email, otp });
    }
  }

  completeRegistration(tempToken: string, password: string): Observable<any> {
    if (this.useMock) {
      return of({ success: true, jwt: 'mock-jwt-' + Date.now() }).pipe(delay(700));
    } else {
      const email = this.email$.value;
      const payload = {
        login: email,
        email: email,
        password: password,
        langKey: 'en'
      };

      return this.http.post(`${this.API_URL}/register`, payload).pipe(
        map(() => ({ success: true }))
      );
    }
  }

  useRealBackend() {
    this.useMock = false;
  }
}