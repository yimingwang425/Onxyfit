import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PasswordResetService {
  
  public tempEmail: string | null = null;
  public tempResetToken: string | null = null;

  private MOCK_OTP_KEY = '_mock_reset_otp';
  private MOCK_TOKEN_KEY = '_mock_reset_token';

  constructor() {}

  sendOtp(email: string): Observable<boolean> {
    this.tempEmail = email;
    const mockOtp = '654321';
    
    localStorage.setItem(this.MOCK_OTP_KEY, mockOtp);
    
    console.log(`[Mock Password Reset] OTP for ${email} is: ${mockOtp}`);
    
    return of(true).pipe(delay(500));
  }

  verifyOtp(otp: string): Observable<{ success: boolean; token: string }> {
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
  }

  setNewPassword(password: string): Observable<{ success: boolean }> {
    const token = this.tempResetToken || localStorage.getItem(this.MOCK_TOKEN_KEY);
    
    if (!token) {
       return throwError(() => new Error('No reset token found. Please start over.'));
    }

    if (!this.tempEmail) {
      console.warn('[Mock Password Reset] tempEmail is not set, but continuing...');
    }

    console.log(`[Mock Password Reset] Successfully set new password for email ${this.tempEmail} (using token ${token})`);

    this.tempEmail = null;
    this.tempResetToken = null;
    localStorage.removeItem(this.MOCK_TOKEN_KEY);

    return of({ success: true }).pipe(delay(500));
  }
}