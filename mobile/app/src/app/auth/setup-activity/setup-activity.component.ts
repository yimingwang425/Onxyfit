import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonButton, IonIcon,
  IonBackButton, IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-setup-activity',
  templateUrl: './setup-activity.component.html',
  styleUrls: ['../auth-shared.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonButton, IonIcon,
    IonBackButton, IonButtons
  ]
})
export class SetupActivityPage {
  form = this.fb.group({
    activityLevel: [null as string | null, [Validators.required]]
  });
  
  activityOptions = [
    { value: 'SEDENTARY', label: 'Sedentary' },
    { value: 'LIGHT', label: 'Light' },
    { value: 'MODERATE', label: 'Moderate' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'VERY_ACTIVE', label: 'Very active' }
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    addIcons({ checkmarkCircle });
  }

  selectOption(value: string) {
    this.form.patchValue({ activityLevel: value });
  }

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