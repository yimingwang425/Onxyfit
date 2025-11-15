import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register';
import { AuthService } from '../../services/auth';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-register-password-confirm',
  standalone: true,
  imports: [IonSpinner, 
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton, IonText,
    ReactiveFormsModule,
    IonBackButton,
    IonButtons
  ],
  templateUrl: './register-password-confirm.page.html'
})
export class RegisterPasswordConfirmPage {
  form = this.fb.group({
    confirmPassword: ['', [Validators.required]]
  });

  loading = false;
  showPassword = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private auth: AuthService,
    private router: Router
  ) {}

  complete() {
    return this.submit();
  }

  async submit() {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please confirm your password';
      return;
    }

    const savedPw = (this.registerService as any).tempPassword
      || localStorage.getItem('temp_register_password') || '';

    const confirm = this.form.value.confirmPassword as string || '';

    if (!savedPw) {
      this.error = 'Original password missing. Please re-enter password.';
      return;
    }

    if (savedPw !== confirm) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;

    const tempToken = (this.registerService as any).tempToken
      || (this.registerService as any).tempToken$?.getValue?.() || localStorage.getItem('temp_register_token') || '';

    try {
      const completeFn = (this.registerService as any).completeRegistration;
      if (typeof completeFn === 'function') {
        const maybeObs = completeFn.call(this.registerService, tempToken || '', savedPw);
        const res: any = await lastValueFrom(maybeObs);
        const jwt = res?.jwt ?? res?.id_token ?? ('mock-jwt-' + Date.now());
        this.auth.setToken(jwt);
        const regEmail = (this.registerService as any).email
          || (this.registerService as any).email$?.getValue?.()
          || localStorage.getItem('temp_register_email') || '';
        if (regEmail) localStorage.setItem('registered_email', regEmail);

      } else {
        const jwt = 'mock-jwt-' + Date.now();
        this.auth.setToken(jwt);
        const regEmail = (this.registerService as any).email || localStorage.getItem('temp_register_email') || '';
        if (regEmail) localStorage.setItem('registered_email', regEmail);
      }

      try { window.dispatchEvent(new CustomEvent('profile-updated', { detail: { email: localStorage.getItem('registered_email') } })); } catch {}

      await this.router.navigateByUrl('/auth/user-profile-setup', { replaceUrl: true });

    } catch (err: any) {
      console.error(err);
      this.error = err?.message ?? 'Registration failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }

  toggleShow() { this.showPassword = !this.showPassword; }
}