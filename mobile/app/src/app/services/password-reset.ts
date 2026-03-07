import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, map, tap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {

  useMock = false;

  public tempEmail: string | null = null;
  public tempResetToken: string | null = null;

  private baseUrl = environment.apiUrl;

  private MOCK_OTP_KEY = '_mock_reset_otp';
  private MOCK_TOKEN_KEY = '_mock_reset_token';

  constructor(private http: HttpClient) {}

  sendOtp(email: string): Observable<boolean> {
    this.tempEmail = email;

    if (this.useMock) {
      const mockOtp = '654321';
      localStorage.setItem(this.MOCK_OTP_KEY, mockOtp);
      console.log(`[Mock Password Reset] OTP for ${email} is: ${mockOtp}`);
      return of(true).pipe(delay(500));
    } else {
      return this.http.post<{ message: string; expiresIn: number }>(
        `${this.baseUrl}/account/reset-password/init`,
        { email }
      ).pipe(
        map(() => true)
      );
    }
  }

  verifyOtp(otp: string): Observable<{ success: boolean; token: string }> {
    if (this.useMock) {
      const storedOtp = localStorage.getItem(this.MOCK_OTP_KEY);
      if (otp === storedOtp) {
        localStorage.removeItem(this.MOCK_OTP_KEY);
        const mockToken = 'mock-reset-token-' + new Date().getTime();
        this.tempResetToken = mockToken;
        localStorage.setItem(this.MOCK_TOKEN_KEY, mockToken);
        return of({ success: true, token: mockToken }).pipe(delay(300));
      } else {
        return throwError(() => new Error('Invalid OTP'));
      }
    } else {
      return this.http.post<{ success: boolean; resetToken: string }>(
        `${this.baseUrl}/account/reset-password/verify`,
        { email: this.tempEmail, otp }
      ).pipe(
        tap(res => {
          if (res.success && res.resetToken) {
            this.tempResetToken = res.resetToken;
          }
        }),
        map(res => ({ success: res.success, token: res.resetToken || '' }))
      );
    }
  }

  setNewPassword(password: string): Observable<{ success: boolean }> {
    if (this.useMock) {
      const token = this.tempResetToken || localStorage.getItem(this.MOCK_TOKEN_KEY);
      if (!token) {
        return throwError(() => new Error('No reset token found. Please start over.'));
      }
      console.log(`[Mock Password Reset] Successfully set new password for ${this.tempEmail}`);
      this.tempEmail = null;
      this.tempResetToken = null;
      localStorage.removeItem(this.MOCK_TOKEN_KEY);
      return of({ success: true }).pipe(delay(500));
    } else {
      return this.http.post<{ success: boolean }>(
        `${this.baseUrl}/account/reset-password/finish`,
        {
          email: this.tempEmail,
          resetToken: this.tempResetToken,
          newPassword: password
        }
      ).pipe(
        tap(() => {
          this.tempEmail = null;
          this.tempResetToken = null;
        })
      );
    }
  }
}