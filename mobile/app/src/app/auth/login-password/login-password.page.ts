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
  IonSpinner
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login-password',
  templateUrl: './login-password.page.html',
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
    CommonModule,
    ReactiveFormsModule
  ]
})
export class LoginPasswordPage {
  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService) {}

  login() {
    this.error = '';
    if (this.form.invalid) {
      this.error = 'Please enter valid Email and Password';
      return;
    }
    this.loading = true;

    //Mock
    setTimeout(() => {
      this.loading = false;
      const fakeJwt = 'mock-jwt-' + Date.now();
      this.auth.setToken(fakeJwt);
      this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
    }, 600);
  }
}
