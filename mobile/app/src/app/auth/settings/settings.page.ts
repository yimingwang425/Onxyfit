import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    IonButton,
    IonButtons,
    IonBackButton
  ],
  templateUrl: './settings.page.html',
  styles: [`.logout { margin-top:18px }`]
})
export class SettingsPage {
  notifications = localStorage.getItem('pref_notifications') === 'true';

  constructor(private router: Router) {}

  toggleNotifications() {
    this.notifications = !this.notifications;
    localStorage.setItem('pref_notifications', String(this.notifications));
  }

  changeEmail() {
    this.router.navigate(['/auth/change-email']).catch(()=>{});
  }

  editPersonalInfo() {
    this.router.navigate(['/auth/user-profile-setup'], { queryParams: { from: 'settings' } }).catch(()=>{});
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.router.navigateByUrl('/auth/welcome', { replaceUrl: true });
  }
}