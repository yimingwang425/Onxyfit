import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonBackButton, IonButtons, IonText, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';
import { environment } from '../../../environments/environment';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-login-email',
  templateUrl: './login-email.page.html',
  standalone: true,
  imports: [IonText, IonSpinner,
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonItem, IonLabel, IonInput, IonButton, IonBackButton, IonButtons
  ],
  styleUrls: ['./login-email.page.scss']
})
export class LoginEmailPage {
  form: FormGroup;
  loading = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.form = this.fb.group({
      email: [
        this.auth.tempLoginEmail || '', 
        [
          Validators.required, 
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)
        ]
      ]
    });
  }

  async next() {
    this.error = '';
    if (this.form.invalid) {
      return;
    }

    const email = (this.form.value.email as string).trim();
    this.loading = true;

    try {
      await lastValueFrom(
        this.http.get(`${environment.apiUrl}/check-email/${encodeURIComponent(email)}`)
      );
      // 200 = not registered
      this.loading = false;
      this.error = 'This email is not registered. Please sign up first.';
      return;
    } catch (err: any) {
      // 409 = email exists
      if (err.status === 409) {
        this.loading = false;
        this.auth.tempLoginEmail = email;
        this.router.navigate(['/auth/login-password']);
        return;
      }
      this.loading = false;
      this.auth.tempLoginEmail = email;
      this.router.navigate(['/auth/login-password']);
    }
  }
}