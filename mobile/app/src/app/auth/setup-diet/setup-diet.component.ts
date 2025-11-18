import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonButton, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-setup-diet',
  templateUrl: './setup-diet.component.html',
  styleUrls: ['./setup-diet.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonButton, IonSelect, IonSelectOption
  ]
})
export class SetupDietPage {
  form = this.fb.group({
    dietPref: ['NO_PREFERENCE', [Validators.required]]
  });
  
  dietOptions = [
    { value: 'BALANCED', label: 'Balanced' },
    { value: 'HIGH_PROTEIN', label: 'High protein' },
    { value: 'VEGETARIAN', label: 'Vegetarian' },
    { value: 'NO_PREFERENCE', label: 'No preference' }
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
    this.router.navigateByUrl('/auth/setup-metabolic');
  }

  next() {
    if (this.form.invalid) { return; }
    this.saveProfileData({ preference: this.form.value.dietPref });
    this.router.navigateByUrl('/auth/setup-metabolic');
  }
}