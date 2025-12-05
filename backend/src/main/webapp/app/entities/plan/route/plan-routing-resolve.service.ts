import { inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { EMPTY, Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { IPlan } from '../plan.model';
import { PlanService } from '../service/plan.service';

const planResolve = (route: ActivatedRouteSnapshot): Observable<null | IPlan> => {
  const id = route.params.id;
  if (id) {
    return inject(PlanService)
      .find(id)
      .pipe(
        mergeMap((plan: HttpResponse<IPlan>) => {
          if (plan.body) {
            return of(plan.body);
          }
          inject(Router).navigate(['404']);
          return EMPTY;
        }),
      );
  }
  return of(null);
};

export default planResolve;
