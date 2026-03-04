import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: true,
  imports: [IonApp, IonRouterOutlet, CommonModule],
})
export class AppComponent {

  showSplash = true;
  splashExit = false;

  constructor(
    private platform: Platform,
    private router: Router,
    private auth: AuthService
  ) {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    await this.platform.ready();

    const target = this.auth.isLoggedIn() ? '/tabs/tab1' : '/auth/welcome';

    try {
      await this.router.navigateByUrl(target, { replaceUrl: true });
    } catch (err) {
      console.error('Error during app init navigation', err);
      await this.router.navigateByUrl('/auth/welcome', { replaceUrl: true });
    }

    setTimeout(() => {
      this.splashExit = true;
      setTimeout(() => {
        this.showSplash = false;
      }, 500);
    }, 2000);
  }
}