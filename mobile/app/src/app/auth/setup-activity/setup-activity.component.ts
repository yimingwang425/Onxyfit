import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonButton, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-setup-activity',
  templateUrl: './setup-activity.component.html',
  styleUrls: ['./setup-activity.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonButton, IonSelect, IonSelectOption
  ]
})
export class SetupActivityPage {
  form = this.fb.group({
    activityLevel: ['MODERATE', [Validators.required]]
  });
  
  // (选项从 user-profile-setup.page.ts 复制而来)
  activityOptions = [
    { value: 'SEDENTARY', label: 'Sedentary' },
    { value: 'LIGHT', label: 'Light' },
    { value: 'MODERATE', label: 'Moderate' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'VERY_ACTIVE', label: 'Very active' }
  ];

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
    this.router.navigateByUrl('/auth/setup-goal');
  }

  next() {
    if (this.form.invalid) { return; }
    this.saveProfileData({ activityLevel: this.form.value.activityLevel });
    this.router.navigateByUrl('/auth/setup-goal');
  }
}