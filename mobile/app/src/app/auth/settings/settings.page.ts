import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
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
    // Placeholder: Can jump to an email modification page, not yet implemented
    this.router.navigateByUrl('/auth/change-email').catch(()=>{});
  }

  editPersonalInfo() {
    this.router.navigate(['/auth/user-profile-setup'], { queryParams: { from: 'settings' } }).catch(()=>{});
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.router.navigateByUrl('/auth/welcome', { replaceUrl: true });
  }
}
