import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonIcon,
  IonAlert,
} from '@ionic/angular/standalone';
import { PasswordResetService } from '../../services/password-reset';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';

function passwordsMatchValidator(form: FormGroup) {
  const password = form.get('password')?.value;
  const confirmPassword = form.get('confirmPassword')?.value;
  return password === confirmPassword ? null : { mismatch: true };
}

@Component({
  selector: 'app-password-reset-set',
  templateUrl: './password-reset-set.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonIcon,
    IonAlert,
  ],
  styleUrls: ['./password-reset-set.page.scss']
})
export class PasswordResetSetPage {
  setPasswordForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  showPassword = false;
  
  isSuccessAlertOpen = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {
    addIcons({ eyeOutline, eyeOffOutline });
    
    this.setPasswordForm = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: passwordsMatchValidator }
    );

    if (!this.passwordResetService.tempResetToken) {
       this.router.navigate(['/auth/login-password'], { replaceUrl: true });
    }
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  submitNewPassword() {
    if (this.setPasswordForm.invalid) {
       if (this.setPasswordForm.errors?.['mismatch']) {
        this.errorMessage = 'The two passwords entered do not match.';
      }
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    const { password } = this.setPasswordForm.getRawValue();

    this.passwordResetService.setNewPassword(password).subscribe({
      next: () => {
        this.isLoading = false;
        this.isSuccessAlertOpen = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Reset failed. Please try again.';
      },
    });
  }
  
  onSuccessAlertDismiss() {
    this.isSuccessAlertOpen = false;
    this.router.navigate(['/auth/login-password'], { replaceUrl: true });
  }
}