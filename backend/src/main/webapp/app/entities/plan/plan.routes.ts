import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import PlanResolve from './route/plan-routing-resolve.service';

const planRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/plan.component').then(m => m.PlanComponent),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/plan-detail.component').then(m => m.PlanDetailComponent),
    resolve: {
      plan: PlanResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/plan-update.component').then(m => m.PlanUpdateComponent),
    resolve: {
      plan: PlanResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/plan-update.component').then(m => m.PlanUpdateComponent),
    resolve: {
      plan: PlanResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default planRoute;
