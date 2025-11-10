import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonSpinner,
  IonText
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { UserProfileService, UserProfileDto } from '../../services/user-profile';

@Component({
  selector: 'app-user-profile-setup',
  templateUrl: './user-profile-setup.page.html',
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonItem,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonSpinner,
    IonText,
    CommonModule,
    ReactiveFormsModule
  ]
})
export class UserProfileSetupPage {
  form = this.fb.group({
    age: [null, [Validators.required, Validators.min(10), Validators.max(100)]],
    heightCm: [null, [Validators.required, Validators.min(80), Validators.max(380)]],
    weightKg: [null, [Validators.required, Validators.min(10)]],
    activityLevel: ['MODERATE', [Validators.required]],
    goal: ['MAINTAIN', [Validators.required]],
    dietPref: ['NO_PREFERENCE', [Validators.required]],
    metabolicProfile: ['PROFILE_1', [Validators.required]]
  });

  loading = false;
  error = '';

  activityOptions = [
    { value: 'SEDENTARY', label: 'Sedentary' },
    { value: 'LIGHT', label: 'Light' },
    { value: 'MODERATE', label: 'Moderate' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'VERY_ACTIVE', label: 'Very active' }
  ];

  goalOptions = [
    { value: 'LOSE', label: 'Lose' },
    { value: 'MAINTAIN', label: 'Maintain' },
    { value: 'GAIN', label: 'Gain' }
  ];

  dietOptions = [
    { value: 'BALANCED', label: 'Balanced' },
    { value: 'HIGH_PROTEIN', label: 'High protein' },
    { value: 'VEGETARIAN', label: 'Vegetarian' },
    { value: 'NO_PREFERENCE', label: 'No preference' }
  ];

  metabolicOptions = [
    { value: 'PROFILE_1', label: 'Profile 1' },
    { value: 'PROFILE_2', label: 'Profile 2' }
  ];

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router
  ) {}

  async submit() {
    this.error = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Please complete all mandatory fields and ensure values fall within the permitted range.';
      return;
    }

    const ageVal = this.form.get('age')!.value;
    const heightVal = this.form.get('heightCm')!.value;
    const weightVal = this.form.get('weightKg')!.value;

    const activityLevel = this.form.get('activityLevel')!.value as UserProfileDto['activityLevel'];
    const goal = this.form.get('goal')!.value as UserProfileDto['goal'];
    const dietPref = this.form.get('dietPref')!.value as UserProfileDto['dietPref'];
    const metabolicProfile = this.form.get('metabolicProfile')!.value as UserProfileDto['metabolicProfile'];

    const dto: UserProfileDto = {
      age: Number(ageVal),
      heightCm: Number(heightVal),
      weightKg: Number(weightVal),
      activityLevel,
      goal,
      dietPref,
      metabolicProfile,
      createdAt: new Date().toISOString()
    };

    this.loading = true;
    try {
      const resp = await lastValueFrom(this.userProfileService.saveProfile(dto));
      this.loading = false;
      if (resp && resp.success) {
        await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      } else {
        this.error = 'Failed to save user data. Please try again later.';
      }
    } catch (err: any) {
      console.error('saveProfile error', err);
      this.loading = false;
      this.error = (err && err.message) ? err.message : 'Failed to save. Please try again later.';
    }
  }
}
