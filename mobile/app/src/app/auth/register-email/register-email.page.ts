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
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { RegisterService } from '../../services/register';
import { environment } from '../../../environments/environment';

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
    IonBackButton,
    IonButtons,
    CommonModule,
    ReactiveFormsModule
  ],
  styleUrls: ['../auth-shared.scss']
})
export class RegisterEmailPage {
  form = this.fb.group({
    email: ['', [
      Validators.required, 
      Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
    ]]
  });

  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private reg: RegisterService,
    private router: Router,
    private http: HttpClient
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
      const res: any = await lastValueFrom(
        this.http.get(`${environment.apiUrl}/check-email/${encodeURIComponent(email)}`)
      );
      if (res?.exists) {
        this.loading = false;
        this.error = 'This email is already registered. Please log in.';
        return;
      }
    } catch (err: any) {
      // 409 = email already exists
      if (err.status === 409) {
        this.loading = false;
        this.error = 'This email is already registered. Please log in.';
        return;
      }
    }

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