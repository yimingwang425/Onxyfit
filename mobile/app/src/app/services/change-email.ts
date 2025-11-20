import { Injectable } from '@angular/core';
import { of, Observable, throwError } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ChangeEmailService {
  
  useMock = true; // false invoke the backend

  
  private baseUrl = '/api'; // base url for backend

  constructor(private http: HttpClient) {}

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
      // backend: POST /api/account/change-email/request { newEmail }
      return this.http.post<{ message: string; expiresIn: number }>(`${this.baseUrl}/account/change-email/request`, { newEmail });
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
      // backend: POST /api/account/change-email/verify { newEmail, otp }
      return this.http.post<{ verified: boolean; token?: string }>(`${this.baseUrl}/account/change-email/verify`, { newEmail, otp });
    }
  }
}
