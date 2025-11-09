import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from './services/auth';


@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(
    private platform: Platform,
    private router: Router,
    private auth: AuthService
  ) {
    this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    await this.platform.ready();

    try {
      if (this.auth.isLoggedIn()) {
        await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
      } else {
        await this.router.navigateByUrl('/auth/welcome', { replaceUrl: true });
      }
    } catch (err) {
      console.error('Error during app init navigation', err);
      await this.router.navigateByUrl('/auth/welcome', { replaceUrl: true });
    }
  }
}
