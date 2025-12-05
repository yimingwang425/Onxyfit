import { Routes } from '@angular/router';

import { UserRouteAccessService } from 'app/core/auth/user-route-access.service';
import { ASC } from 'app/config/navigation.constants';
import OtpRecordResolve from './route/otp-record-routing-resolve.service';

const otpRecordRoute: Routes = [
  {
    path: '',
    loadComponent: () => import('./list/otp-record.component').then(m => m.OtpRecordComponent),
    data: {
      defaultSort: `id,${ASC}`,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/view',
    loadComponent: () => import('./detail/otp-record-detail.component').then(m => m.OtpRecordDetailComponent),
    resolve: {
      otpRecord: OtpRecordResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: 'new',
    loadComponent: () => import('./update/otp-record-update.component').then(m => m.OtpRecordUpdateComponent),
    resolve: {
      otpRecord: OtpRecordResolve,
    },
    canActivate: [UserRouteAccessService],
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./update/otp-record-update.component').then(m => m.OtpRecordUpdateComponent),
    resolve: {
      otpRecord: OtpRecordResolve,
    },
    canActivate: [UserRouteAccessService],
  },
];

export default otpRecordRoute;
