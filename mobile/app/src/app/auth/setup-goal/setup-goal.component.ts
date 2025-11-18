import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonButton, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-setup-goal',
  templateUrl: './setup-goal.component.html',
  styleUrls: ['./setup-goal.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonButton, IonSelect, IonSelectOption
  ]
})
export class SetupGoalPage {
  form = this.fb.group({
    goal: ['MAINTAIN', [Validators.required]]
  });
  
  goalOptions = [
    { value: 'LOSE', label: 'Lose' },
    { value: 'MAINTAIN', label: 'Maintain' },
    { value: 'GAIN', label: 'Gain' }
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
    this.router.navigateByUrl('/auth/setup-diet');
  }

  next() {
    if (this.form.invalid) { return; }
    this.saveProfileData({ goal: this.form.value.goal });
    this.router.navigateByUrl('/auth/setup-diet');
  }
}