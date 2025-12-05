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
  IonNote,
  NavController
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UserProfileService } from '../../services/user-profile';
import { AuthService } from '../../services/auth';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-profile-setup',
  templateUrl: './user-profile-setup.page.html',
  styleUrls: ['./user-profile-setup.page.scss'],
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
    age: [null as number | null, [Validators.required, Validators.min(10), Validators.max(100)]],
    heightCm: [null as number | null, [Validators.required, Validators.min(80), Validators.max(380)]],
    weightKg: [null as number | null, [Validators.required, Validators.min(10)]],
    activityLevel: [null as string | null, [Validators.required]],
    goal: [null as string | null, [Validators.required]],
    dietPref: [null as string | null, [Validators.required]],
    metabolicProfile: [null as string | null, [Validators.required]]
  });

  loading = false;
  error = '';
  public returnFrom: string | null = null;

  private fullProfile: any = {};

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
    { value: 'PROFILE_1', label: 'Male' },
    { value: 'PROFILE_2', label: 'Female' }
  ];

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private alertCtrl: AlertController,
    private navCtrl: NavController
  ) {
    addIcons({ informationCircleOutline });
  }

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.returnFrom = this.route.snapshot.queryParamMap.get('from');
    this.loadExistingData();
  }

  loadExistingData() {
    this.userProfileService.getProfileData().subscribe({
      next: (data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const profile = data[0];
          this.fullProfile = profile;
          console.log('Successfully loaded Profile from the backend', profile);
          this.patchForm(profile);
        } else {
          this.loadFromLocal();
        }
      },
      error: () => {
        this.loadFromLocal();
      }
    });
  }

  private loadFromLocal() {
    const raw = localStorage.getItem('user_profile');
    if (raw) {
      try {
        const obj = JSON.parse(raw);
        this.fullProfile = obj;
        this.patchForm(obj);
      } catch (e) {
        console.error('Error parsing local profile', e);
      }
    }
  }

  private patchForm(obj: any) {
    this.form.patchValue({
      age: obj.age ?? obj.ageYears ?? null,
      heightCm: obj.heightCm ?? obj.height_cm ?? obj.height ?? null,
      weightKg: obj.weightKg ?? obj.weight_kg ?? obj.weight ?? null,
      activityLevel: obj.activityLevel ?? null,
      goal: obj.goal ?? null,
      dietPref: obj.dietPref ?? obj.preference ?? obj.diet ?? null,
      metabolicProfile: obj.metabolicProfile ?? null
    });
  }

  async openMetabolicInfo() {
    const msg = `We use the Mifflin-St Jeor equation...`;
    const alert = await this.alertCtrl.create({
      header: 'Biological Sex & Calculation',
      message: msg,
      buttons: ['OK']
    });
    await alert.present();
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      const account = await firstValueFrom(this.authService.identity());
      
      if (!account) {
        throw new Error('User not logged in');
      }

      const payload = {
        ...this.fullProfile,
        ...this.form.value,
        user: { 
          id: account.id, 
          login: account.login 
        },
        updatedAt: new Date().toISOString()
      };

      console.log('Submitting Profile:', payload);

      await firstValueFrom(this.userProfileService.saveProfile(payload));

      window.dispatchEvent(new CustomEvent('profile-updated'));

      if (this.returnFrom === 'settings') {
        await this.navCtrl.navigateBack('/tabs/tab4');
      } else if (this.returnFrom === 'missing' || this.returnFrom === 'review') {
        this.navCtrl.back();
      } else {
        await this.navCtrl.navigateRoot('/tabs/tab1');
      }

    } catch (err: any) {
      console.error('Save failed:', err);
      this.error = 'Failed to save profile. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}