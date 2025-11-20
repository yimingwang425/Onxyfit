import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar, 
  IonButton, IonIcon,
  IonBackButton, IonButtons, IonLabel } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmarkCircle, informationCircleOutline } from 'ionicons/icons';

@Component({
  selector: 'app-setup-metabolic',
  templateUrl: './setup-metabolic.component.html',
  styleUrls: ['./setup-metabolic.component.scss'],
  standalone: true,
  imports: [IonLabel, 
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
    private alertCtrl: AlertController
  ) {
    addIcons({ checkmarkCircle, informationCircleOutline });
  }

  selectOption(value: string) {
    this.form.patchValue({ metabolicProfile: value });
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
    this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  }

  next() {
    if (this.form.invalid) { return; }
    this.saveProfileData({ metabolicProfile: this.form.value.metabolicProfile });
    this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
  }
}