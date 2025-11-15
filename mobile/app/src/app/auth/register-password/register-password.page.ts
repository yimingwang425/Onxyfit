import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonIcon, IonText,
  IonBackButton,
  IonButtons
} from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register';

@Component({
  selector: 'app-register-password',
  standalone: true,
  imports: [IonText, 
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton, IonIcon,
    IonBackButton,
    IonButtons,
    ReactiveFormsModule
  ],
  templateUrl: './register-password.page.html'
})
export class RegisterPasswordPage {
  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  loading = false;
  showPassword = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private registerService: RegisterService,
    private router: Router
  ) {}

  next() {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please enter a password with at least 8 characters';
      return;
    }

    const pw = this.form.value.password as string;
    try {
      (this.registerService as any).tempPassword = pw;
      localStorage.setItem('temp_register_password', pw);
    } catch (e) { console.warn(e); }

    this.router.navigateByUrl('/auth/register-password-confirm');
  }

  toggleShow() { this.showPassword = !this.showPassword; }
}