import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonItem,
  IonInput,
  AlertController, IonList, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-delete-account',
  standalone: true,
  imports: [IonIcon, IonLabel, IonList, 
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonItem,
    IonInput
  ],
  templateUrl: './delete-account.page.html',
  styleUrls: ['./delete-account.page.scss']
})
export class DeleteAccountPage {

  confirmText = '';
  isDeleting = false;

  private API_URL = environment.apiUrl;

  constructor(
    private router: Router,
    private auth: AuthService,
    private alertCtrl: AlertController,
    private http: HttpClient
  ) {}

  get canDelete(): boolean {
    return this.confirmText === 'DELETE';
  }

  async onDelete() {
    if (!this.canDelete || this.isDeleting) return;

    const alert = await this.alertCtrl.create({
      header: 'Are you sure?',
      message: 'This action is permanent. All your data, plans, and progress will be deleted and cannot be recovered.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => this.executeDelete()
        }
      ]
    });
    await alert.present();
  }

  private async executeDelete() {
    this.isDeleting = true;

    try {
      await this.http.delete(`${this.API_URL}/account`).toPromise();
      this.clearAllLocalData();
      this.auth.logout();
    } catch (err) {
      this.isDeleting = false;
      const errorAlert = await this.alertCtrl.create({
        header: 'Error',
        message: 'Failed to delete account. Please try again later.',
        buttons: ['OK']
      });
      await errorAlert.present();
    }
  }

  private clearAllLocalData() {
    const email = localStorage.getItem('registered_email') || '';
    if (email) {
      localStorage.removeItem(`user_avatar_${email}`);
    }
    const keys = [
      'user_profile', 'registered_email', 'user_avatar',
      'has_confirmed_plan_start', '_mock_change_email',
      'today_mood', 'today_water', 'last_log_date',
      'pref_notifications', 'temp_register_email',
      'temp_register_password'
    ];
    keys.forEach(k => localStorage.removeItem(k));
  }
}