import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButton, IonIcon, 
  IonBackButton, IonButtons, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle } from 'ionicons/icons';

@Component({
  selector: 'app-setup-goal',
  templateUrl: './setup-goal.component.html',
  styleUrls: ['../auth-shared.scss'],
  standalone: true,
  imports: [IonLabel, 
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonButton, IonIcon,
    IonBackButton, IonButtons
  ]
})
export class SetupGoalPage {
  form = this.fb.group({
    goal: [null as string | null, [Validators.required]]
  });
  
  goalOptions = [
    { value: 'LOSE', label: 'Lose Weight' },
    { value: 'MAINTAIN', label: 'Maintain Weight' },
    { value: 'GAIN', label: 'Gain Muscle' }
  ];

  constructor(private fb: FormBuilder, private router: Router) {
    addIcons({ checkmarkCircle });
  }

  selectOption(value: string) {
    this.form.patchValue({ goal: value });
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
    this.router.navigateByUrl('/auth/setup-diet');
  }

  next() {
    if (this.form.invalid) { return; }
    this.saveProfileData({ goal: this.form.value.goal });
    this.router.navigateByUrl('/auth/setup-diet');
  }
}