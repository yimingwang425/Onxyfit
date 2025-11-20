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
  IonNote,
  IonSpinner,
  IonBackButton,
  IonButtons,
  IonAlert,
} from '@ionic/angular/standalone';
import { PasswordResetService } from '../../services/password-reset';

@Component({
  selector: 'app-password-reset-email',
  templateUrl: './password-reset-email.page.html',
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
    IonNote,
    IonSpinner,
    IonBackButton,
    IonButtons,
    IonAlert,
  ],
  styleUrls: ['./password-reset-email.page.scss']
})
export class PasswordResetEmailPage {
  resetForm: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  isAlertOpen = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
    });
  }

  sendOtp() {
    if (this.resetForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    const email = this.resetForm.getRawValue().email;

    this.passwordResetService.sendOtp(email).subscribe({
      next: () => {
        this.isLoading = false;
        this.isAlertOpen = true;
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.message || 'Failed to send OTP. Please try again.';
      },
    });
  }
  
  onAlertDismiss() {
    this.isAlertOpen = false;
    this.router.navigate(['/auth/password-reset-verify']);
  }
}