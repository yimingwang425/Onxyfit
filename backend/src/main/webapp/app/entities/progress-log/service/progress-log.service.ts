import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { DATE_FORMAT } from 'app/config/input.constants';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IProgressLog, NewProgressLog } from '../progress-log.model';

export type PartialUpdateProgressLog = Partial<IProgressLog> & Pick<IProgressLog, 'id'>;

type RestOf<T extends IProgressLog | NewProgressLog> = Omit<T, 'logDate' | 'createdAt'> & {
  logDate?: string | null;
  createdAt?: string | null;
};

export type RestProgressLog = RestOf<IProgressLog>;

export type NewRestProgressLog = RestOf<NewProgressLog>;

export type PartialUpdateRestProgressLog = RestOf<PartialUpdateProgressLog>;

export type EntityResponseType = HttpResponse<IProgressLog>;
export type EntityArrayResponseType = HttpResponse<IProgressLog[]>;

@Injectable({ providedIn: 'root' })
export class ProgressLogService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/progress-logs');

  create(progressLog: NewProgressLog): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(progressLog);
    return this.http
      .post<RestProgressLog>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(progressLog: IProgressLog): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(progressLog);
    return this.http
      .put<RestProgressLog>(`${this.resourceUrl}/${this.getProgressLogIdentifier(progressLog)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(progressLog: PartialUpdateProgressLog): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(progressLog);
    return this.http
      .patch<RestProgressLog>(`${this.resourceUrl}/${this.getProgressLogIdentifier(progressLog)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestProgressLog>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestProgressLog[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getProgressLogIdentifier(progressLog: Pick<IProgressLog, 'id'>): number {
    return progressLog.id;
  }

  compareProgressLog(o1: Pick<IProgressLog, 'id'> | null, o2: Pick<IProgressLog, 'id'> | null): boolean {
    return o1 && o2 ? this.getProgressLogIdentifier(o1) === this.getProgressLogIdentifier(o2) : o1 === o2;
  }

  addProgressLogToCollectionIfMissing<Type extends Pick<IProgressLog, 'id'>>(
    progressLogCollection: Type[],
    ...progressLogsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const progressLogs: Type[] = progressLogsToCheck.filter(isPresent);
    if (progressLogs.length > 0) {
      const progressLogCollectionIdentifiers = progressLogCollection.map(progressLogItem => this.getProgressLogIdentifier(progressLogItem));
      const progressLogsToAdd = progressLogs.filter(progressLogItem => {
        const progressLogIdentifier = this.getProgressLogIdentifier(progressLogItem);
        if (progressLogCollectionIdentifiers.includes(progressLogIdentifier)) {
          return false;
        }
        progressLogCollectionIdentifiers.push(progressLogIdentifier);
        return true;
      });
      return [...progressLogsToAdd, ...progressLogCollection];
    }
    return progressLogCollection;
  }

  protected convertDateFromClient<T extends IProgressLog | NewProgressLog | PartialUpdateProgressLog>(progressLog: T): RestOf<T> {
    return {
      ...progressLog,
      logDate: progressLog.logDate?.format(DATE_FORMAT) ?? null,
      createdAt: progressLog.createdAt?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restProgressLog: RestProgressLog): IProgressLog {
    return {
      ...restProgressLog,
      logDate: restProgressLog.logDate ? dayjs(restProgressLog.logDate) : undefined,
      createdAt: restProgressLog.createdAt ? dayjs(restProgressLog.createdAt) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestProgressLog>): HttpResponse<IProgressLog> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestProgressLog[]>): HttpResponse<IProgressLog[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
