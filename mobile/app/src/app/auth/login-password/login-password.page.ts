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
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login-password',
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonSpinner, IonText, CommonModule, ReactiveFormsModule
  ],
  templateUrl: './login-password.page.html',
  styles: [`
    ion-item { margin-top: 10px; }
  `]
})
export class LoginPasswordPage {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  login() {
    this.submit();
  }

  submit() {
    this.error = '';
    if (this.form.invalid) {
      this.error = 'Please enter valid Email and Password';
      return;
    }
    this.loading = true;

    //MOCK login 
    const email = this.form.value.email as string;

    setTimeout(() => {
      this.loading = false;
      const fakeJwt = 'mock-jwt-' + Date.now();
      this.auth.setToken(fakeJwt);

      try {
        localStorage.setItem('registered_email', email);
      } catch (e) {
        console.warn('failed to set registered_email on login', e);
      }

      this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
    }, 600);
  }
}
