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
  IonText, IonSpinner } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register';

@Component({
  selector: 'app-register-password',
  templateUrl: './register-password.page.html',
  standalone: true,
  imports: [IonSpinner, 
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    CommonModule,
    ReactiveFormsModule
  ]
})
export class RegisterPasswordPage {
  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  loading = false;
  error = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private reg: RegisterService,
    private router: Router
  ) {}

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  continue() {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please set a password of at least 8 characters.';
      return;
    }

    const pwRaw = this.form.value.password ?? '';
    const password = (typeof pwRaw === 'string' ? pwRaw : '').trim();

    if (!password) {
      this.error = 'Please set a password.';
      return;
    }

    (this.reg as any).tempPassword = password;

    this.router.navigateByUrl('/auth/register-password-confirm');
  }
}
