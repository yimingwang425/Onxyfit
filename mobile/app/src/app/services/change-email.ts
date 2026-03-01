import { Injectable } from '@angular/core';
import { of, Observable, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChangeEmailService {
  
  useMock = false;

  private baseUrl = environment.apiUrl; // uses environment apiUrl

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('authenticationToken') || localStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  sendChangeEmailOtp(newEmail: string): Observable<{ message: string; expiresIn: number }> {
    if (this.useMock) {
      const otp = '123456';
      const expiresIn = 5 * 60;
      const payload = {
        email: newEmail,
        otp,
        expiresAt: Date.now() + expiresIn * 1000
      };

      localStorage.setItem('_mock_change_email', JSON.stringify(payload));
      console.log('MOCK sendChangeEmailOtp -> otp:', otp);
      return of({ message: 'otp_sent', expiresIn }).pipe(delay(800));
    } else {
      return this.http.post<{ message: string; expiresIn: number }>(
        `${this.baseUrl}/account/change-email/request`,
        { newEmail },
        { headers: this.getAuthHeaders() }
      );
    }
  }

  verifyChangeEmailOtp(newEmail: string, otp: string): Observable<{ verified: boolean; token?: string }> {
    if (this.useMock) {
      const raw = localStorage.getItem('_mock_change_email');
      if (!raw) {
        return throwError(() => new Error('No OTP requested'));
      }
      const obj = JSON.parse(raw);
      if (obj.email !== newEmail) {
        return throwError(() => new Error('OTP was sent to a different email'));
      }
      if (Date.now() > obj.expiresAt) {
        return throwError(() => new Error('OTP expired'));
      }
      if (obj.otp !== otp) {
        return throwError(() => new Error('Invalid OTP'));
      }
      localStorage.removeItem('_mock_change_email');

      return of({ verified: true, token: 'mock-change-email-token' }).pipe(delay(500));
    } else {
      return this.http.post<{ verified: boolean; token?: string }>(
        `${this.baseUrl}/account/change-email/verify`,
        { newEmail, otp },
        { headers: this.getAuthHeaders() }
      );
    }
  }
}