import { Component } from '@angular/core';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonText, IonSpinner,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ChangeEmailService } from '../../services/change-email';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-change-email',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonText, IonSpinner, CommonModule, ReactiveFormsModule,
    IonBackButton,
    IonButtons
  ],
  templateUrl: './change-email.page.html',
  styleUrls: ['../auth-shared.scss']
})
export class ChangeEmailPage {
  step: 1 | 2 = 1;
  loading = false;
  error = '';

  formEmail = this.fb.group({
    newEmail: ['', [Validators.required, Validators.email]]
  });

  formOtp = this.fb.group({
    newEmail: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  // countdown for resend
  resendSeconds = 0;
  private resendTimer?: any;

  constructor(private fb: FormBuilder, private svc: ChangeEmailService, private router: Router) {}

  async sendOtp() {
    this.error = '';
    if (this.formEmail.invalid) { this.formEmail.markAllAsTouched(); return; }
    this.loading = true;
    try {
      const newEmail = this.formEmail.value.newEmail as string;
      const res = await lastValueFrom(this.svc.sendChangeEmailOtp(newEmail));
      if (!res) {
        throw new Error('No response from server');
      }

      this.formOtp.patchValue({ newEmail });
      this.step = 2;
      this.startResendCountdown(res.expiresIn ?? 300);
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to send OTP';
    } finally { this.loading = false; }
  }

  private startResendCountdown(seconds: number) {
    this.resendSeconds = Math.max(0, Math.floor(seconds));
    if (this.resendTimer) { clearInterval(this.resendTimer); }
    this.resendTimer = setInterval(() => {
      this.resendSeconds--;
      if (this.resendSeconds <= 0) {
        clearInterval(this.resendTimer);
        this.resendTimer = undefined;
      }
    }, 1000);
  }

  async verifyOtp() {
    this.error = '';
    if (this.formOtp.invalid) { this.formOtp.markAllAsTouched(); return; }
    this.loading = true;
    try {
      const newEmail = this.formOtp.value.newEmail as string;
      const otp = this.formOtp.value.otp as string;
      const res = await lastValueFrom(this.svc.verifyChangeEmailOtp(newEmail, otp));
      if (!res || !res.verified) {
        throw new Error('Verification failed. Please check the code and try again.');
      }

      localStorage.setItem('registered_email', newEmail);

      try {
        const raw = localStorage.getItem('user_profile');
        if (raw) {
          const obj = JSON.parse(raw);
          obj.email = newEmail;
          localStorage.setItem('user_profile', JSON.stringify(obj));
        }
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('profile-updated', { detail: { email: newEmail } }));

      await this.router.navigateByUrl('/tabs/tab4', { replaceUrl: true });
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to verify OTP';
    } finally {
      this.loading = false;
    }
  }

  resend() {
    const email = this.formOtp.value.newEmail || this.formEmail.value.newEmail;
    if (!email) { this.error = 'No email to resend to'; return; }
    this.sendOtp();
  }

  cancel() {
    this.router.navigateByUrl('/auth/settings', { replaceUrl: true });
  }
}