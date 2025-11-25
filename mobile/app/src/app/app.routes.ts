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
      {
        path: 'password-reset-email',
        loadComponent: () => import('./auth/password-reset-email/password-reset-email.page').then( m => m.PasswordResetEmailPage)
      },
      {
        path: 'password-reset-verify',
        loadComponent: () => import('./auth/password-reset-verify/password-reset-verify.page').then( m => m.PasswordResetVerifyPage)
      },
      {
        path: 'password-reset-set',
        loadComponent: () => import('./auth/password-reset-set/password-reset-set.page').then( m => m.PasswordResetSetPage)
      },

      // **** (修改点) 路由路径 ****
      // (从 .page 改为 .component)
      {
        path: 'setup-age',
        loadComponent: () => import('./auth/setup-age/setup-age.component').then( m => m.SetupAgePage)
      },
      {
        path: 'setup-height',
        loadComponent: () => import('./auth/setup-height/setup-height.component').then( m => m.SetupHeightPage)
      },
      {
        path: 'setup-weight',
        loadComponent: () => import('./auth/setup-weight/setup-weight.component').then( m => m.SetupWeightPage)
      },
      {
        path: 'setup-activity',
        loadComponent: () => import('./auth/setup-activity/setup-activity.component').then( m => m.SetupActivityPage)
      },
      {
        path: 'setup-goal',
        loadComponent: () => import('./auth/setup-goal/setup-goal.component').then( m => m.SetupGoalPage)
      },
      {
        path: 'setup-diet',
        loadComponent: () => import('./auth/setup-diet/setup-diet.component').then( m => m.SetupDietPage)
      },
      {
        path: 'setup-metabolic',
        loadComponent: () => import('./auth/setup-metabolic/setup-metabolic.component').then( m => m.SetupMetabolicPage)
      },
      {
        path: 'notification',
        loadComponent: () => import('./auth/notification/notification.page').then( m => m.NotificationPage)
      },
    ]
  },
];