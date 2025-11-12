import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  templateUrl: './profile.page.html',
  styles: [`
    .avatar { font-size: 56px; width:96px; height:96px; display:flex; align-items:center; justify-content:center; border-radius:50%; margin:12px auto; background:#f2f2f2; }
    .center { text-align:center; }
    .field-label { color: #666; font-size:13px; }
    .field-value { font-size:16px; margin-top:6px; }
  `]
})
export class ProfilePage implements OnInit {
  avatar = '🐶';
  displayName = '';
  email = '';
  profile: any = {};

  animalEmojis = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯'];

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.pickAvatar();

    const raw = localStorage.getItem('user_profile');
    if (raw) {
      try { this.profile = JSON.parse(raw); } catch { this.profile = {}; }
    }

    this.displayName = localStorage.getItem('user_name') || this.profile.username || '';
    this.email = localStorage.getItem('registered_email') || this.profile.email || '';

    if (!this.displayName && this.email) {
      this.displayName = this.email;
    }
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

  goSettings() {
    this.router.navigateByUrl('/auth/settings');
  }
}
