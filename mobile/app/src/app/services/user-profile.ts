import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';

export type UserProfileDto = {
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  goal: 'LOSE' | 'MAINTAIN' | 'GAIN';
  dietPref: 'BALANCED' | 'HIGH_PROTEIN' | 'VEGETARIAN' | 'NO_PREFERENCE';
  metabolicProfile: 'PROFILE_1' | 'PROFILE_2';
  createdAt: string;
};

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private useMock = true;
  private readonly endpoint = '/api/user-profiles'; //backend

  constructor(private http: HttpClient) {}

  useRealBackend() {
    this.useMock = false;
  }

  saveProfile(profile: UserProfileDto): Observable<{ success: boolean; data?: any }> {
    if (this.useMock) {
      return of({ success: true, data: profile }).pipe(delay(600));
    } else {
      return this.http.post<{ success: boolean; data?: any }>(this.endpoint, profile); //backend
    }
  }
}
