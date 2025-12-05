import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IOtpRecord, NewOtpRecord } from '../otp-record.model';

export type PartialUpdateOtpRecord = Partial<IOtpRecord> & Pick<IOtpRecord, 'id'>;

type RestOf<T extends IOtpRecord | NewOtpRecord> = Omit<T, 'expiryTime'> & {
  expiryTime?: string | null;
};

export type RestOtpRecord = RestOf<IOtpRecord>;

export type NewRestOtpRecord = RestOf<NewOtpRecord>;

export type PartialUpdateRestOtpRecord = RestOf<PartialUpdateOtpRecord>;

export type EntityResponseType = HttpResponse<IOtpRecord>;
export type EntityArrayResponseType = HttpResponse<IOtpRecord[]>;

@Injectable({ providedIn: 'root' })
export class OtpRecordService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/otp-records');

  create(otpRecord: NewOtpRecord): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(otpRecord);
    return this.http
      .post<RestOtpRecord>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(otpRecord: IOtpRecord): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(otpRecord);
    return this.http
      .put<RestOtpRecord>(`${this.resourceUrl}/${this.getOtpRecordIdentifier(otpRecord)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(otpRecord: PartialUpdateOtpRecord): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(otpRecord);
    return this.http
      .patch<RestOtpRecord>(`${this.resourceUrl}/${this.getOtpRecordIdentifier(otpRecord)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestOtpRecord>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestOtpRecord[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getOtpRecordIdentifier(otpRecord: Pick<IOtpRecord, 'id'>): number {
    return otpRecord.id;
  }

  compareOtpRecord(o1: Pick<IOtpRecord, 'id'> | null, o2: Pick<IOtpRecord, 'id'> | null): boolean {
    return o1 && o2 ? this.getOtpRecordIdentifier(o1) === this.getOtpRecordIdentifier(o2) : o1 === o2;
  }

  addOtpRecordToCollectionIfMissing<Type extends Pick<IOtpRecord, 'id'>>(
    otpRecordCollection: Type[],
    ...otpRecordsToCheck: (Type | null | undefined)[]
  ): Type[] {
    const otpRecords: Type[] = otpRecordsToCheck.filter(isPresent);
    if (otpRecords.length > 0) {
      const otpRecordCollectionIdentifiers = otpRecordCollection.map(otpRecordItem => this.getOtpRecordIdentifier(otpRecordItem));
      const otpRecordsToAdd = otpRecords.filter(otpRecordItem => {
        const otpRecordIdentifier = this.getOtpRecordIdentifier(otpRecordItem);
        if (otpRecordCollectionIdentifiers.includes(otpRecordIdentifier)) {
          return false;
        }
        otpRecordCollectionIdentifiers.push(otpRecordIdentifier);
        return true;
      });
      return [...otpRecordsToAdd, ...otpRecordCollection];
    }
    return otpRecordCollection;
  }

  protected convertDateFromClient<T extends IOtpRecord | NewOtpRecord | PartialUpdateOtpRecord>(otpRecord: T): RestOf<T> {
    return {
      ...otpRecord,
      expiryTime: otpRecord.expiryTime?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restOtpRecord: RestOtpRecord): IOtpRecord {
    return {
      ...restOtpRecord,
      expiryTime: restOtpRecord.expiryTime ? dayjs(restOtpRecord.expiryTime) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestOtpRecord>): HttpResponse<IOtpRecord> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestOtpRecord[]>): HttpResponse<IOtpRecord[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
