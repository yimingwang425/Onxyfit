import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonItem, IonLabel, IonInput, IonButton, IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-setup-name',
  templateUrl: './setup-name.component.html',
  styleUrls: ['../auth-shared.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonText
  ]
})
export class SetupNamePage {
  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(30)]]
  });

  constructor(private fb: FormBuilder, private router: Router) {}

  skip() {
    this.router.navigateByUrl('/auth/setup-age');
  }

  next() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const name = (this.form.value.firstName || '').trim();
    if (name) {
      localStorage.setItem('user_display_name', name);
    }
    this.router.navigateByUrl('/auth/setup-age');
  }
}