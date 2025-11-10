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
import { lastValueFrom } from 'rxjs';
import { RegisterService } from '../../services/register';

@Component({
  selector: 'app-register-email',
  templateUrl: './register-email.page.html',
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
export class RegisterEmailPage {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private reg: RegisterService,
    private router: Router
  ) {}

  async sendOtp() {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please enter a valid email address.';
      return;
    }

    const emailRaw = this.form.value.email ?? '';
    const email = (typeof emailRaw === 'string' ? emailRaw.trim() : '');

    if (!email) {
      this.error = 'Please enter a valid email address.';
      return;
    }

    this.loading = true;
    try {
      const resp = await lastValueFrom(this.reg.sendOtp(email));
      this.loading = false;
      await this.router.navigateByUrl('/auth/register-verify');
    } catch (err: any) {
      console.error('sendOtp error', err);
      this.loading = false;
      this.error = (err && err.message) ? err.message : 'Failed to send verification code. Please try again.';
    }
  }
}
