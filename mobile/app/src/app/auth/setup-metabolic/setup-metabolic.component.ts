import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButton, IonIcon,
  IonBackButton, IonButtons, IonLabel 
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, informationCircleOutline } from 'ionicons/icons';
import { UserProfileService } from '../../services/user-profile';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-setup-metabolic',
  templateUrl: './setup-metabolic.component.html',
  styleUrls: ['./setup-metabolic.component.scss'],
  standalone: true,
  imports: [
    IonLabel, 
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonButton, IonIcon,
    IonBackButton, IonButtons
  ]
})
export class SetupMetabolicPage {
  form = this.fb.group({
    metabolicProfile: [null as string | null, [Validators.required]]
  });
  
  metabolicOptions = [
    { value: 'PROFILE_1', label: 'Male' },
    { value: 'PROFILE_2', label: 'Female' }
  ];

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private alertCtrl: AlertController,
    private userProfileService: UserProfileService,
    private authService: AuthService
  ) {
    addIcons({ checkmarkCircle, informationCircleOutline });
  }

  selectOption(value: string) {
    this.form.patchValue({ metabolicProfile: value });
  }

  async openMetabolicInfo() {
    const msg = `
      <p>We use the Mifflin-St Jeor equation to calculate your metabolic rate.</p>
      <p><strong>Male:</strong> Uses standard male BMR constant (+5).</p>
      <p><strong>Female:</strong> Uses standard female BMR constant (-161).</p>
      <br/>
      <small>Stored as Profile 1/2 in our database.</small>
    `;
    const alert = await this.alertCtrl.create({
      header: 'Biological Sex',
      message: msg,
      buttons: ['OK']
    });
    await alert.present();
  }

  skip() {
    console.warn('User skipped metabolic profile setup');
    this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  }

  next() {
    if (this.form.invalid) { return; }
    const currentStepData = { metabolicProfile: this.form.value.metabolicProfile };

    let finalProfile: any = {};
    const raw = localStorage.getItem('user_profile');
    if (raw) {
      try { finalProfile = JSON.parse(raw); } catch (e) {}
    }

    this.authService.identity().subscribe({
      next: (account) => {
        
        const payload = {
          ...finalProfile,
          ...currentStepData,
          user: { 
            id: account.id, 
            login: account.login 
          },
          createdAt: new Date().toISOString()
        };

        console.log('Sending Profile to Backend:', payload);

        this.userProfileService.saveProfile(payload).subscribe({
          next: (res) => {
            console.log('Profile saved successfully!', res);
            
            localStorage.removeItem('user_profile');
            this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
          },
          error: (err) => {
            console.error('Failed to save profile', err);
            this.alertCtrl.create({
              header: 'Error',
              message: 'Could not save profile. Please check your connection.',
              buttons: ['OK']
            }).then(a => a.present());
          }
        });
      },
      error: (err) => {
        console.error('User is not logged in?', err);

        this.router.navigateByUrl('/auth/welcome');
      }
    });
  }
}