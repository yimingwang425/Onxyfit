import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
} from '@ionic/angular/standalone';
import { PasswordResetService } from '../../services/password-reset';

@Component({
  selector: 'app-password-reset-verify',
  templateUrl: './password-reset-verify.page.html',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
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
  ],
  styleUrls: ['./password-reset-verify.page.scss']
})
export class PasswordResetVerifyPage {
  otp: string = '';
  isLoading = false;
  errorMessage: string | null = null;
  
  email: string | null = null;

  constructor(
    private router: Router,
    private passwordResetService: PasswordResetService
  ) {
    this.email = this.passwordResetService.tempEmail;
    if (!this.email) {
      this.router.navigate(['/auth/password-reset-email'], { replaceUrl: true });
    }
  }

  verifyOtp() {
    if (!this.otp || this.otp.length < 6) {
      this.errorMessage = 'Please enter the 6-digit verification code';
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;

    this.passwordResetService.verifyOtp(this.otp).subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.router.navigate(['/auth/password-reset-set']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = 'Verification failed. Please try again.';
      },
    });
  }
}