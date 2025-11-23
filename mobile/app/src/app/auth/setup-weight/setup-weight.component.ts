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
  selector: 'app-setup-weight',
  templateUrl: './setup-weight.component.html',
  styleUrls: ['../auth-shared.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonText,
    IonBackButton, IonButtons
  ]
})
export class SetupWeightPage {
  form = this.fb.group({
    weightKg: [null, [Validators.required, Validators.min(10)]]
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
    this.router.navigateByUrl('/auth/setup-activity');
  }

  next() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saveProfileData({ weightKg: this.form.value.weightKg });
    this.router.navigateByUrl('/auth/setup-activity');
  }
}