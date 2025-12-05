import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonText, IonSpinner,
  IonBackButton,
  IonButtons, IonIcon 
} from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register';
import { AuthService } from '../../services/auth';
import { lastValueFrom } from 'rxjs';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register-password-confirm',
  templateUrl: './register-password-confirm.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton, IonText,
    IonBackButton, IonButtons, IonIcon, IonSpinner,
    ReactiveFormsModule
  ],
  styleUrls: ['../auth-shared.scss']
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
  ) {
    addIcons({ eyeOutline, eyeOffOutline });
  }

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
      
      const maybeObs = completeFn.call(this.registerService, tempToken || '', savedPw);
      await lastValueFrom(maybeObs);
      
      console.log('Account registration successful! Now initiating automatic login to obtain the token...');

      const regEmail = (this.registerService as any).email
          || (this.registerService as any).email$?.getValue?.()
          || localStorage.getItem('temp_register_email') || '';
      
      if (!regEmail) {
        throw new Error('Email missing for auto login');
      }

      const loginCreds = {
        username: regEmail,
        password: savedPw,
        rememberMe: true
      };

      await lastValueFrom(this.auth.login(loginCreds));
      
      console.log('Automatic login successful');

      localStorage.setItem('registered_email', regEmail);
      try { window.dispatchEvent(new CustomEvent('profile-updated', { detail: { email: regEmail } })); } catch {}

      await this.router.navigateByUrl('/auth/setup-age', { replaceUrl: true });

    } catch (err: any) {
      console.error('Failed to register or log in:', err);
      if (err.status === 400 && err.error?.type === 'login-already-used') {
        this.error = 'This email is already registered. Please log in.';
      } else {
        this.error = 'Registration failed. Please try again.';
      }
    } finally {
      this.loading = false;
    }
  }

  toggleShow() { this.showPassword = !this.showPassword; }
}