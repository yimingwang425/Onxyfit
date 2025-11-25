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
  IonBackButton,
  IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';

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
    IonBackButton,
    IonIcon
  ],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage {
  
  constructor(private router: Router) {
    addIcons({ chevronForward });
  }

  goToNotifications() {
    this.router.navigate(['/auth/notification']).catch(()=>{});
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