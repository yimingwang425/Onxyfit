import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IOtpRecord } from '../otp-record.model';
import { OtpRecordService } from '../service/otp-record.service';

const otpRecordResolve = (route: ActivatedRouteSnapshot): Observable<null | IOtpRecord> => {
  const id = route.params.id;
  if (id) {
    return inject(OtpRecordService)
      .find(id)
      .pipe(
        mergeMap((otpRecord: HttpResponse<IOtpRecord>) => {
          if (otpRecord.body) {
            return of(otpRecord.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default otpRecordResolve;
