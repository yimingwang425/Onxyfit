import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  email$ = new BehaviorSubject<string>('');
  tempToken$ = new BehaviorSubject<string | null>(null);

  tempPassword?: string;

  private useMock = false;

  constructor(private http: HttpClient) {}

  setEmail(email: string) { this.email$.next(email); }

  sendOtp(email: string): Observable<{ message: string; expiresIn: number }> {
    this.setEmail(email);
    if (this.useMock) {
      return of({ message: 'otp_sent', expiresIn: 600 }).pipe(delay(700));
    } else {
      return this.http.post<{ message: string; expiresIn: number }>('/api/register/send-otp', { email });
    }
  }

  verifyOtp(email: string, otp: string): Observable<{ verified: boolean; tempToken?: string }> {
    if (this.useMock) {
      const ok = true;
      if (ok) {
        const fake = 'mock-temp-' + Date.now();
        this.tempToken$.next(fake);
        return of({ verified: true, tempToken: fake }).pipe(delay(500));
      } else {
        return of({ verified: false }).pipe(delay(300));
      }
    } else {
      return this.http.post<{ verified: boolean; tempToken?: string }>('/api/register/verify-otp', { email, otp });
    }
  }

  completeRegistration(tempToken: string, password: string): Observable<{ success: boolean; jwt?: string }> {
    if (this.useMock) {
      return of({ success: true, jwt: 'mock-jwt-' + Date.now() }).pipe(delay(700));
    } else {
      return this.http.post<{ success: boolean; jwt?: string }>(
        '/api/register/complete',
        { password },
        {
          headers: { Authorization: `Bearer ${tempToken}` }
        }
      );
    }
  }

  useRealBackend() {
    this.useMock = false;
  }
}
