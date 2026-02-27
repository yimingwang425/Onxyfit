import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { UserProfileService } from '../../services/user-profile'; 
import { addIcons } from 'ionicons';
import { settingsOutline, chevronForward, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tab4',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
})
export class Tab4Page implements OnInit, OnDestroy {
  avatar = '🐶';
  displayName = 'User';
  email = '';
  profile: any = {};
  aiPlanInfo: any = {};

  private animalEmojis = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐷','🐵'];

  constructor(
    private auth: AuthService, 
    private router: Router,
    private userProfileService: UserProfileService 
  ) {
    addIcons({ settingsOutline, chevronForward, personOutline });
  }

  private profileUpdatedHandler = (ev: any) => {
    this.loadProfile();
  };

  ngOnInit(): void {
    this.pickAvatar();
    this.loadProfile();
    window.addEventListener('profile-updated', this.profileUpdatedHandler as EventListener);
  }

  ngOnDestroy(): void {
    window.removeEventListener('profile-updated', this.profileUpdatedHandler as EventListener);
  }
  
  ionViewWillEnter() {
    this.pickAvatar();
    this.loadProfile();
    this.loadAIPlanInfo();
  }

  private loadAIPlanInfo() {
    try {
      const planStr = localStorage.getItem('current_ai_plan');
      if (planStr) {
        const plan = JSON.parse(planStr);
        this.aiPlanInfo = {
          workoutType: plan.workoutType || '',
          calories: plan.caloriesKcal || '',
          protein: plan.proteinG || '',
        };
      }
    } catch { }
  }

  private pickAvatar() {
    const email = localStorage.getItem('registered_email') || localStorage.getItem('auth_email') || '';
    if (email) {
      const key = `user_avatar_${email}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        this.avatar = saved;
        return;
      }
      const idx = this.emailHashIndex(email, this.animalEmojis.length);
      this.avatar = this.animalEmojis[idx];
      try { localStorage.setItem(key, this.avatar); } catch (e) {}
      return;
    }

    const savedGlobal = localStorage.getItem('user_avatar');
    if (savedGlobal) {
      this.avatar = savedGlobal;
      return;
    }

    const idx = Math.floor(Math.random() * this.animalEmojis.length);
    this.avatar = this.animalEmojis[idx];
    try { localStorage.setItem('user_avatar', this.avatar); } catch (e) {}
  }

  private loadProfile() {
    const regEmail = localStorage.getItem('registered_email') || localStorage.getItem('auth_email') || '';
    this.email = regEmail;
    this.displayName = regEmail ? regEmail.split('@')[0] : 'User';

    // 调用后端接口
    this.userProfileService.getProfileData().subscribe({
      // 【修改】明确指定参数类型为 any，解决 TS 报错
      next: (data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          this.profile = data[0];
          console.log('✅ Tab4: 成功从后端加载 Profile', this.profile);
        } else {
          this.profile = {};
        }
      },
      // 【修改】明确指定参数类型为 any
      error: (err: any) => {
        console.error('❌ Tab4: 加载 Profile 失败 (可能是 401 或网络问题)', err);
      }
    });
  }

  private emailHashIndex(email: string, modulo: number): number {
    let h = 0;
    for (let i = 0; i < email.length; i++) {
      h = (h * 31 + email.charCodeAt(i)) >>> 0;
    }
    return h % modulo;
  }

  goToSettings() {
    this.router.navigateByUrl('/auth/settings');
  }

  goToEditProfile() {
    this.router.navigateByUrl('/auth/settings'); 
  }

  logout() {
    try { this.auth.logout(); } catch (e) {}
    this.router.navigateByUrl('/auth/welcome', { replaceUrl: true });
  }
}