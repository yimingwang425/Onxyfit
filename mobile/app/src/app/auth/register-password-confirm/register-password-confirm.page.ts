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
  IonText
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-register-password-confirm',
  templateUrl: './register-password-confirm.page.html',
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
    CommonModule,
    ReactiveFormsModule
  ]
})
export class RegisterPasswordConfirmPage {
  form = this.fb.group({ password2: ['', [Validators.required]] });
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private reg: RegisterService,
    private auth: AuthService,
    private router: Router
  ) {}

  complete() {
    this.error = '';
    const pw1 = (this.reg as any).tempPassword;
    const pw2 = this.form.value.password2;
    if (!pw1) { this.error = 'Please set a password first'; return; }
    if (pw1 !== pw2) { this.error = 'The two passwords do not match'; return; }

    this.loading = true;
    const token = this.reg.tempToken$.value || 'mock-temp-token';
    this.reg.completeRegistration(token, pw1).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.success) {
          const jwt = res.jwt ?? ('mock-jwt-' + Date.now());
          this.auth.setToken(jwt);
          this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
        } else {
          this.error = 'Registration failed. Please try again later.';
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Registration failed. Please try again later.';
      }
    });
  }
}
