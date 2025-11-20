import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent,
  IonItem, IonLabel, IonInput, IonButton, IonText,
  IonBackButton, IonButtons, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from '../../services/register';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

@Component({
  selector: 'app-register-password',
  templateUrl: './register-password.page.html',
  styleUrls: ['../auth-shared.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton, IonText,
    IonBackButton, IonButtons, IonIcon, IonSpinner,
    ReactiveFormsModule
  ]
})
export class RegisterPasswordPage {
  form = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]]
  });

  showPassword = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private registerService: RegisterService
  ) {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  toggleShow() {
    this.showPassword = !this.showPassword;
  }

  next() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Password must be at least 8 characters.';
      return;
    }
    this.registerService.tempPassword = this.form.value.password || '';
    localStorage.setItem('temp_register_password', this.registerService.tempPassword);
    
    this.router.navigateByUrl('/auth/register-password-confirm');
  }
}