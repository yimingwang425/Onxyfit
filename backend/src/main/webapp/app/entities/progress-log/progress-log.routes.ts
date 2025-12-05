import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import ProgressLogResolve from './route/progress-log-routing-resolve.service';

const progressLogRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/progress-log.component').then(m => m.ProgressLogComponent),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/progress-log-detail.component').then(m => m.ProgressLogDetailComponent),
    resolve: {
      progressLog: ProgressLogResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/progress-log-update.component').then(m => m.ProgressLogUpdateComponent),
    resolve: {
      progressLog: ProgressLogResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/progress-log-update.component').then(m => m.ProgressLogUpdateComponent),
    resolve: {
      progressLog: ProgressLogResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default progressLogRoute;
