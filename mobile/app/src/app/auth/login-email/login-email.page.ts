import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login-email',
  templateUrl: './login-email.page.html',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonHeader, IonToolbar, IonTitle,
    IonContent, IonItem, IonLabel, IonInput, IonButton, IonBackButton, IonButtons
  ],
  styles: [`
    ion-item { margin-top: 10px; }
  `]
})
export class LoginEmailPage {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: [this.auth.tempLoginEmail || '', [Validators.required, Validators.email]]
    });
  }

  next() {
    if (this.form.invalid) {
      return;
    }

    const email = this.form.value.email as string;
    
    this.auth.tempLoginEmail = email;

    this.router.navigate(['/auth/login-password']);
  }
}