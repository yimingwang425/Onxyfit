import { Component, OnInit } from '@angular/core';
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
  IonButtons,
  IonChip, 
  IonList,
  IonIcon,
  IonAlert
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { NavController, LoadingController, AlertController } from '@ionic/angular';

import { PasswordResetService } from '../../services/password-reset'; 

@Component({
  selector: 'app-login-password',
  standalone: true,
  imports: [IonList, 
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonSpinner, IonText, CommonModule, ReactiveFormsModule,
    IonBackButton, IonButtons, IonChip,
    IonIcon,
    IonAlert
  ],
  templateUrl: './login-password.page.html',
  styleUrls: ['./login-password.page.scss']
})
export class LoginPasswordPage implements OnInit {
  
  form: FormGroup; 
  loading = false;
  error: string | null = null;
  email: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder, 
    private auth: AuthService, 
    private router: Router,
    private navCtrl: NavController,
    private alertController: AlertController,
    private loadingCtrl: LoadingController,
    private passwordResetService: PasswordResetService
  ) {
    addIcons({ eyeOutline, eyeOffOutline });
    
    this.form = this.fb.group({
      password: ['', [Validators.required]]
    });
  }

  ngOnInit() {
    this.email = this.auth.tempLoginEmail;

    if (!this.email) {
      this.router.navigate(['/auth/login-email'], { replaceUrl: true });
    }
  }

  ionViewWillEnter() {
    this.form.reset();
    this.error = null;
    this.loading = false;

    this.email = this.auth.tempLoginEmail;
    if (!this.email) {
      this.router.navigate(['/auth/login-email'], { replaceUrl: true });
    }
  }

  login() {
    this.submit();
  }

  submit() {
    this.error = null;
    if (this.form.invalid) {
      return; 
    }
    if (!this.email) {
      this.router.navigate(['/auth/login-email'], { replaceUrl: true });
      return;
    }

    this.loading = true;
    const { password } = this.form.getRawValue();

    const credentials = {
      username: this.email, // JHipster 默认字段名叫 username
      password: password,
      rememberMe: true      // 建议加上这个，保持登录状态
    };

    this.auth.login(credentials).subscribe({
      next: (response: any) => {
        this.loading = false;
        localStorage.setItem('registered_email', this.email as string);
        this.auth.tempLoginEmail = null; 
        this.navCtrl.navigateRoot('/tabs/tab1', { replaceUrl: true });
      },
      error: (err: any) => {
        this.loading = false;
        if (err.status === 401) {
          this.error = 'Incorrect password. Please try again.';
        } else {
          this.error = 'Login failed. Please check your connection.';
        }
        console.error('Login failed:', err);
      }
    });
  }

  changeEmail() {
    this.router.navigate(['/auth/login-email']);
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  async forgotPassword() {
    if (!this.email) {
      this.router.navigate(['/auth/password-reset-email']).then();
      return;
    }

    this.passwordResetService.sendOtp(this.email).subscribe({
      next: () => {
        this.router.navigate(['/auth/password-reset-verify']).then();
      },
      error: () => {
        this.showAlert('Failed to send', 'Unable to send verification code. Please try again.');
      }
    });
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}