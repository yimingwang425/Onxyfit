import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButton, IonIcon,
  IonBackButton, IonButtons, IonLabel, IonItem } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-setup-diet',
  templateUrl: './setup-diet.component.html',
  styleUrls: ['../auth-shared.scss'],
  standalone: true,
  imports: [IonItem, IonLabel, 
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonButton, IonIcon,
    IonBackButton, IonButtons
  ]
})
export class SetupDietPage {
  form = this.fb.group({
    dietPref: [null as string | null, [Validators.required]]
  });
  
  dietOptions = [
    { value: 'BALANCED', label: 'Balanced' },
    { value: 'HIGH_PROTEIN', label: 'High Protein' },
    { value: 'VEGETARIAN', label: 'Vegetarian' },
    { value: 'NO_PREFERENCE', label: 'No Preference' }
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    addIcons({ checkmarkCircle });
  }

  selectOption(value: string) {
    this.form.patchValue({ dietPref: value });
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
    this.router.navigateByUrl('/auth/setup-metabolic');
  }

  next() {
    if (this.form.invalid) { return; }
    this.saveProfileData({ dietPref: this.form.value.dietPref });
    this.router.navigateByUrl('/auth/setup-metabolic');
  }
}