import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'authority',
    data: { pageTitle: 'fypApp.adminAuthority.home.title' },
    loadChildren: () => import('./admin/authority/authority.routes'),
  },
  {
    path: 'otp-record',
    data: { pageTitle: 'fypApp.otpRecord.home.title' },
    loadChildren: () => import('./otp-record/otp-record.routes'),
  },
  {
    path: 'user-profile',
    data: { pageTitle: 'fypApp.userProfile.home.title' },
    loadChildren: () => import('./user-profile/user-profile.routes'),
  },
  {
    path: 'plan',
    data: { pageTitle: 'fypApp.plan.home.title' },
    loadChildren: () => import('./plan/plan.routes'),
  },
  {
    path: 'progress-log',
    data: { pageTitle: 'fypApp.progressLog.home.title' },
    loadChildren: () => import('./progress-log/progress-log.routes'),
  },
  /* jhipster-needle-add-entity-route - JHipster will add entity modules routes here */
];

export default routes;
