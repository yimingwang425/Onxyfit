import { Component, OnInit } from '@angular/core';
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
import { Router, ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';
import { UserProfileService } from '../../services/user-profile';

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
export class UserProfileSetupPage implements OnInit {
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

  private returnFrom: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.returnFrom = this.route.snapshot.queryParamMap.get('from');

    if (this.returnFrom === 'settings') {
    const raw = localStorage.getItem('user_profile');
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        this.form.patchValue({
          age: obj.age ?? null,
          heightCm: obj.height_cm ?? null,
          weightKg: obj.weight_kg ?? null,
          activityLevel: obj.activityLevel ?? 'MODERATE',
          goal: obj.goal ?? 'MAINTAIN',
          dietPref: obj.preference ?? 'NO_PREFERENCE',
          metabolicProfile: obj.metabolicProfile ?? 'PROFILE_1'
        });
      } catch {}
    }
  }
  }

  async submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading = true;
    this.error = '';

    const payload: any = {
      age: this.form.value.age,
      height_cm: this.form.value.heightCm,
      weight_kg: this.form.value.weightKg,
      preference: this.form.value.dietPref,
      activityLevel: this.form.value.activityLevel,
      goal: this.form.value.goal
    };

    try {
      // local save for profile page to read
      localStorage.setItem('user_profile', JSON.stringify(payload));

      // backend later
      // try { await lastValueFrom(this.userProfileService.saveProfile(payload)); } catch(e) { console.warn(e); }

      if (this.returnFrom === 'settings') {
        await this.router.navigateByUrl('/tabs/tab4', { replaceUrl: true });
      } else {
        await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      }

    } catch (e: any) {
      this.error = e?.message ?? 'Failed to save profile';
    } finally {
      this.loading = false;
    }
  }
}
