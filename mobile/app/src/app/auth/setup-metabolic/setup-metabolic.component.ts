import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem,
  IonLabel, IonButton, IonSelect, IonSelectOption, IonIcon
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-setup-metabolic',
  templateUrl: './setup-metabolic.component.html',
  styleUrls: ['./setup-metabolic.component.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle,
    IonToolbar, IonItem, IonLabel, IonButton, IonSelect, IonSelectOption, IonIcon
  ]
})
export class SetupMetabolicPage {
  form = this.fb.group({
    metabolicProfile: ['PROFILE_1', [Validators.required]]
  });
  
  metabolicOptions = [
    { value: 'PROFILE_1', label: 'Profile 1' },
    { value: 'PROFILE_2', label: 'Profile 2' }
  ];

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private alertCtrl: AlertController
  ) {
    addIcons({ informationCircleOutline });
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

  // (复制自 user-profile-setup.page.ts)
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

  // 这是最后一步，所以都跳转到 Tab 1
  skip() {
    this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  }

  next() {
    if (this.form.invalid) { return; }
    this.saveProfileData({ metabolicProfile: this.form.value.metabolicProfile });
    this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  }
}