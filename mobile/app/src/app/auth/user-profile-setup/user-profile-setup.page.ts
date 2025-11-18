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
  IonText, 
  IonIcon,
  IonBackButton,
  IonButtons,
  IonNote
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserProfileService } from '../../services/user-profile';

@Component({
  selector: 'app-user-profile-setup',
  templateUrl: './user-profile-setup.page.html',
  standalone: true,
  imports: [
    IonIcon, 
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
    ReactiveFormsModule,
    IonBackButton,
    IonButtons,
    IonNote
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
  
  public returnFrom: string | null = null;

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController
  ) {}

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.returnFrom = this.route.snapshot.queryParamMap.get('from');

    if (this.returnFrom === 'settings') {
      const raw = localStorage.getItem('user_profile');
      if (raw) {
        try {
          const obj = JSON.parse(raw);
          this.form.patchValue({
            age: obj.age ?? obj.ageYears ?? null,
            heightCm: obj.height_cm ?? obj.height ?? null,
            weightKg: obj.weight_kg ?? obj.weight ?? null,
            activityLevel: obj.activityLevel ?? 'MODERATE',
            goal: obj.goal ?? 'MAINTAIN',
            dietPref: obj.preference ?? obj.dietPref ?? obj.diet ?? 'NO_PREFERENCE',
            metabolicProfile: obj.metabolicProfile ?? 'PROFILE_1'
          });
        } catch (e) {
        }
      }
    }
  }

  async openMetabolicInfo() {
    const msg = `
      <p>Our app uses standard formulas (Mifflin-St Jeor) to calculate your calorie needs. These formulas use two different statistical models.</p>
      <p><strong>Profile 1:</strong> Select this to use the formula developed for male physiology (e.g., +5 in the equation).</p>
      <p><strong>Profile 2:</strong> Select this to use the formula developed for female physiology (e.g., -161 in the equation).</p>
      <p>Please choose the profile you feel is most appropriate for calculating your personal metabolic rate. This selection is only used for this mathematical calculation.</p>
    `;
    const alert = await this.alertCtrl.create({
      header: 'Metabolic profile',
      message: msg,
      buttons: ['OK']
    });
    await alert.present();
  }
  // **** (干净的版本 结束) ****

  async submit() {
    if (this.form.invalid) { 
      this.form.markAllAsTouched();
      return; 
    }

    this.loading = true;
    this.error = '';

    const payload: any = {
      age: this.form.value.age,
      height_cm: this.form.value.heightCm,
      weight_kg: this.form.value.weightKg,
      preference: this.form.value.dietPref,
      activityLevel: this.form.value.activityLevel,
      goal: this.form.value.goal,
      metabolicProfile: this.form.value.metabolicProfile
    };

    try {
      localStorage.setItem('user_profile', JSON.stringify(payload));

      window.dispatchEvent(new CustomEvent('profile-updated'));

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