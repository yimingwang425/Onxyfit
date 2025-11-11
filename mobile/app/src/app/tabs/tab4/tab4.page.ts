import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-tab4',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './tab4.page.html',
  styles: [`
    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
      margin: 8px auto;
      background: var(--ion-color-light);
    }
    .center { text-align: center; }
    .username { font-weight: 600; margin-top: 8px; }
    .email { color: var(--ion-color-medium); font-size: 13px; }
    .field-label { color: var(--ion-color-medium); font-size: 13px; margin-top: 12px; }
    .field-value { font-size: 16px; margin-top: 6px; }
    ion-card { margin-top: 14px; }
    .buttons { margin-top: 16px; }
  `]
})
export class Tab4Page implements OnInit {
  avatar = '🐶';
  displayName = 'User';
  email = '';
  profile: any = {};

  private animalEmojis = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐷','🐵'];

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.pickAvatar();
    this.loadProfile();
  }

  private pickAvatar() {
    const saved = localStorage.getItem('user_avatar');
    if (saved) {
      this.avatar = saved;
      return;
    }
    const idx = Math.floor(Math.random() * this.animalEmojis.length);
    this.avatar = this.animalEmojis[idx];
    try { localStorage.setItem('user_avatar', this.avatar); } catch (e) {}
  }

  private loadProfile() {
    const raw = localStorage.getItem('user_profile');
    if (raw) {
      try { this.profile = JSON.parse(raw); } catch { this.profile = {}; }
    } else {
      this.profile = {};
    }

    const nameFromLS = localStorage.getItem('user_name');
    const regEmail = localStorage.getItem('registered_email') || localStorage.getItem('auth_email') || '';
    this.displayName = nameFromLS || this.profile.username || (regEmail ? this.shortenEmail(regEmail) : 'User');
    this.email = this.profile.email || regEmail;
  }

  private shortenEmail(e: string) {
    return e;
  }

  goToSettings() {
    this.router.navigateByUrl('/settings');
  }

  logout() {
    try { this.auth.logout(); } catch (e) {}
    this.router.navigateByUrl('/auth/welcome', { replaceUrl: true });
  }
}
