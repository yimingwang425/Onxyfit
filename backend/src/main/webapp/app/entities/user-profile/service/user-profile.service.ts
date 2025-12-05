import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import dayjs from 'dayjs/esm';

import { isPresent } from 'app/core/util/operators';
import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { createRequestOption } from 'app/core/request/request-util';
import { IUserProfile, NewUserProfile } from '../user-profile.model';

export type PartialUpdateUserProfile = Partial<IUserProfile> & Pick<IUserProfile, 'id'>;

type RestOf<T extends IUserProfile | NewUserProfile> = Omit<T, 'createdAt'> & {
  createdAt?: string | null;
};

export type RestUserProfile = RestOf<IUserProfile>;

export type NewRestUserProfile = RestOf<NewUserProfile>;

export type PartialUpdateRestUserProfile = RestOf<PartialUpdateUserProfile>;

export type EntityResponseType = HttpResponse<IUserProfile>;
export type EntityArrayResponseType = HttpResponse<IUserProfile[]>;

@Injectable({ providedIn: 'root' })
export class UserProfileService {
  protected readonly http = inject(HttpClient);
  protected readonly applicationConfigService = inject(ApplicationConfigService);

  protected resourceUrl = this.applicationConfigService.getEndpointFor('api/user-profiles');

  create(userProfile: NewUserProfile): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(userProfile);
    return this.http
      .post<RestUserProfile>(this.resourceUrl, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  update(userProfile: IUserProfile): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(userProfile);
    return this.http
      .put<RestUserProfile>(`${this.resourceUrl}/${this.getUserProfileIdentifier(userProfile)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  partialUpdate(userProfile: PartialUpdateUserProfile): Observable<EntityResponseType> {
    const copy = this.convertDateFromClient(userProfile);
    return this.http
      .patch<RestUserProfile>(`${this.resourceUrl}/${this.getUserProfileIdentifier(userProfile)}`, copy, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  find(id: number): Observable<EntityResponseType> {
    return this.http
      .get<RestUserProfile>(`${this.resourceUrl}/${id}`, { observe: 'response' })
      .pipe(map(res => this.convertResponseFromServer(res)));
  }

  query(req?: any): Observable<EntityArrayResponseType> {
    const options = createRequestOption(req);
    return this.http
      .get<RestUserProfile[]>(this.resourceUrl, { params: options, observe: 'response' })
      .pipe(map(res => this.convertResponseArrayFromServer(res)));
  }

  delete(id: number): Observable<HttpResponse<{}>> {
    return this.http.delete(`${this.resourceUrl}/${id}`, { observe: 'response' });
  }

  getUserProfileIdentifier(userProfile: Pick<IUserProfile, 'id'>): number {
    return userProfile.id;
  }

  compareUserProfile(o1: Pick<IUserProfile, 'id'> | null, o2: Pick<IUserProfile, 'id'> | null): boolean {
    return o1 && o2 ? this.getUserProfileIdentifier(o1) === this.getUserProfileIdentifier(o2) : o1 === o2;
  }

  addUserProfileToCollectionIfMissing<Type extends Pick<IUserProfile, 'id'>>(
    userProfileCollection: Type[],
    ...userProfilesToCheck: (Type | null | undefined)[]
  ): Type[] {
    const userProfiles: Type[] = userProfilesToCheck.filter(isPresent);
    if (userProfiles.length > 0) {
      const userProfileCollectionIdentifiers = userProfileCollection.map(userProfileItem => this.getUserProfileIdentifier(userProfileItem));
      const userProfilesToAdd = userProfiles.filter(userProfileItem => {
        const userProfileIdentifier = this.getUserProfileIdentifier(userProfileItem);
        if (userProfileCollectionIdentifiers.includes(userProfileIdentifier)) {
          return false;
        }
        userProfileCollectionIdentifiers.push(userProfileIdentifier);
        return true;
      });
      return [...userProfilesToAdd, ...userProfileCollection];
    }
    return userProfileCollection;
  }

  protected convertDateFromClient<T extends IUserProfile | NewUserProfile | PartialUpdateUserProfile>(userProfile: T): RestOf<T> {
    return {
      ...userProfile,
      createdAt: userProfile.createdAt?.toJSON() ?? null,
    };
  }

  protected convertDateFromServer(restUserProfile: RestUserProfile): IUserProfile {
    return {
      ...restUserProfile,
      createdAt: restUserProfile.createdAt ? dayjs(restUserProfile.createdAt) : undefined,
    };
  }

  protected convertResponseFromServer(res: HttpResponse<RestUserProfile>): HttpResponse<IUserProfile> {
    return res.clone({
      body: res.body ? this.convertDateFromServer(res.body) : null,
    });
  }

  protected convertResponseArrayFromServer(res: HttpResponse<RestUserProfile[]>): HttpResponse<IUserProfile[]> {
    return res.clone({
      body: res.body ? res.body.map(item => this.convertDateFromServer(item)) : null,
    });
  }
}
