import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonInput, IonButton, IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-setup-age',
  templateUrl: './setup-age.component.html',
  styleUrls: ['../auth-shared.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonInput, IonButton, IonText
  ]
})
export class SetupAgePage implements OnInit {
  form = this.fb.group({
    age: [null, [Validators.required, Validators.min(10), Validators.max(100)]]
  });

  constructor(private fb: FormBuilder, private router: Router) {}

  ngOnInit() {
    localStorage.removeItem('user_profile');
    localStorage.removeItem('has_confirmed_plan_start'); 
    console.log('Cleared stale profile data and confirmation flags.');
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
    this.router.navigateByUrl('/auth/setup-height');
  }

  next() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saveProfileData({ age: this.form.value.age });
    this.router.navigateByUrl('/auth/setup-height');
  }
}