import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'auth',
    children: [
      {
        path: 'register-email',
        loadComponent: () => import('./auth/register-email/register-email.page').then(m => m.RegisterEmailPage)
      },
      {
        path: 'register-verify',
        loadComponent: () => import('./auth/register-verify/register-verify.page').then(m => m.RegisterVerifyPage)
      },
      {
        path: 'register-password',
        loadComponent: () => import('./auth/register-password/register-password.page').then(m => m.RegisterPasswordPage)
      },
      {
        path: 'register-password-confirm',
        loadComponent: () => import('./auth/register-password-confirm/register-password-confirm.page').then(m => m.RegisterPasswordConfirmPage)
      },
      {
        path: 'user-profile-setup',
        loadComponent: () => import('./auth/user-profile-setup/user-profile-setup.page').then(m => m.UserProfileSetupPage)
      },
      {
        path: 'welcome',
        loadComponent: () => import('./auth/welcome/welcome.page').then(m => m.WelcomePage)
      },
      {
        path: 'login-email',
        loadComponent: () => import('./auth/login-email/login-email.page').then(m => m.LoginEmailPage)
      },
      {
        path: 'login-password',
        loadComponent: () => import('./auth/login-password/login-password.page').then(m => m.LoginPasswordPage)
      },
      {
        path: 'change-email',
        loadComponent: () => import('./auth/change-email/change-email.page').then(m => m.ChangeEmailPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./auth/profile/profile.page').then( m => m.ProfilePage)
      },
      {
        path: 'settings',
        loadComponent: () => import('./auth/settings/settings.page').then( m => m.SettingsPage)
      },
    ]
  },
];
