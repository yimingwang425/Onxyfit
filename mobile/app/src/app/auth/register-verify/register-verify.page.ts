import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonText,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { RegisterService } from '../../services/register';

@Component({
  selector: 'app-register-verify',
  templateUrl: './register-verify.page.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    IonText,
    IonBackButton,
    IonButtons,
    CommonModule,
    ReactiveFormsModule
  ],
  styleUrls: ['../auth-shared.scss']
})
export class RegisterVerifyPage {
  form = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(10)]]
  });

  loading = false;
  error = '';

  currentEmail = '';

  constructor(
    private fb: FormBuilder,
    private reg: RegisterService,
    private router: Router
  ) {
    this.currentEmail = this.reg.email$.value || '';
    this.reg.email$.subscribe(e => {
      if (e) this.currentEmail = e;
    });
  }

  async verifyOtp() {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please enter the verification code you have received.';
      return;
    }

    const otpRaw = this.form.value.otp ?? '';
    const otp = (typeof otpRaw === 'string' ? otpRaw.trim() : '');

    if (!otp) {
      this.error = 'Please enter the verification code';
      return;
    }

    const email = this.currentEmail || this.reg.email$.value || '';

    if (!email) {
      this.error = 'The email address has not yet been entered. Please return to the previous page to enter your email address.';
      return;
    }

    this.loading = true;
    try {
      const resp = await lastValueFrom(this.reg.verifyOtp(email, otp));
      this.loading = false;
      if (resp.verified) {
        if (resp.tempToken) {
          this.reg.tempToken$.next(resp.tempToken);
        }
        await this.router.navigateByUrl('/auth/register-password');
      } else {
        this.error = 'The verification code is incorrect. Please try again.';
      }
    } catch (err: any) {
      console.error('verifyOtp error', err);
      this.loading = false;
      this.error = (err && err.message) ? err.message : 'Verification code failed. Please try again.';
    }
  }

  editEmail() {
    this.router.navigateByUrl('/auth/register-email');
  }
}