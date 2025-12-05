import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IProgressLog } from '../progress-log.model';
import { ProgressLogService } from '../service/progress-log.service';

const progressLogResolve = (route: ActivatedRouteSnapshot): Observable<null | IProgressLog> => {
  const id = route.params.id;
  if (id) {
    return inject(ProgressLogService)
      .find(id)
      .pipe(
        mergeMap((progressLog: HttpResponse<IProgressLog>) => {
          if (progressLog.body) {
            return of(progressLog.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default progressLogResolve;
