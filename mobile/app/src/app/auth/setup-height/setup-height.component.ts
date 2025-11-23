import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonInput, IonButton, IonText,
  IonBackButton, IonButtons
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-setup-height',
  templateUrl: './setup-height.component.html',
  styleUrls: ['../auth-shared.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonText,
    IonBackButton, IonButtons
  ]
})
export class SetupHeightPage {
  form = this.fb.group({
    heightCm: [null, [Validators.required, Validators.min(80), Validators.max(380)]]
  });

  constructor(private fb: FormBuilder, private router: Router) {}

  private saveProfileData(data: any) {
    let profile: any = {};
    const raw = localStorage.getItem('user_profile');
    if (raw) {
      try { profile = JSON.parse(raw); } catch (e) {}
    }
    const updatedProfile = { ...profile, ...data };
    localStorage.setItem('user_profile', JSON.stringify(updatedProfile));
  }

  skip() {
    this.router.navigateByUrl('/auth/setup-weight');
  }

  next() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saveProfileData({ heightCm: this.form.value.heightCm });
    this.router.navigateByUrl('/auth/setup-weight');
  }
}