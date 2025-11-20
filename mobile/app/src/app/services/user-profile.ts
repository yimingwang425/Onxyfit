import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

export type UserProfileDto = {
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  goal: 'LOSE' | 'MAINTAIN' | 'GAIN';
  dietPref: 'BALANCED' | 'HIGH_PROTEIN' | 'VEGETARIAN' | 'NO_PREFERENCE';
  metabolicProfile?: 'PROFILE_1' | 'PROFILE_2'; 
  createdAt: string;
};

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private useMock = true;
  private readonly endpoint = '/api/user-profiles';

  private requiredFields: (keyof UserProfileDto)[] = [
    'age', 'heightCm', 'weightKg', 'activityLevel', 'goal', 'dietPref'
  ];

  private fieldLabels: Record<string, string> = {
    age: 'Age',
    heightCm: 'Height',
    weightKg: 'Weight',
    activityLevel: 'Activity Level',
    goal: 'Goal',
    dietPref: 'Diet Preference'
  };

  constructor(private http: HttpClient) {}

  useRealBackend() {
    this.useMock = false;
  }

  saveProfile(profile: UserProfileDto): Observable<{ success: boolean; data?: any }> {
    if (this.useMock) {
      return of({ success: true, data: profile }).pipe(
        delay(600),
        tap(() => {
           const current = this.getProfile() || {};
           const updated = { ...current, ...profile };
           console.log('🔥 [Mock] Profile Saved to LocalStorage:', updated);
           localStorage.setItem('user_profile', JSON.stringify(updated));
        })
      );
    } else {
      return this.http.post<{ success: boolean; data?: any }>(this.endpoint, profile);
    }
  }

  getProfile(): UserProfileDto | null {
    const p = localStorage.getItem('user_profile');
    return p ? JSON.parse(p) : null;
  }

  getMissingFields(): string[] {
    const profile = this.getProfile();
    
    if (!profile) {
      console.log('❌ [Check] No profile found in localStorage!');
      return Object.values(this.fieldLabels);
    }

    const missing: string[] = [];
    this.requiredFields.forEach(key => {
      const val = profile[key];
      if (val === null || val === undefined || val === '') {
        console.log(`❌ [Check] Missing Field detected: ${key}`);
        missing.push(this.fieldLabels[key as string]);
      }
    });
    
    if (missing.length === 0) {
      console.log('✅ [Check] Profile is complete!');
    }
    
    return missing;
  }

  getSummaryString(): string {
    const profile = this.getProfile();
    if (!profile) return 'No information available';

    return `
      Age: ${profile.age || '-'}
      Height: ${profile.heightCm || '-'} cm
      Weight: ${profile.weightKg || '-'} kg
      Activity: ${profile.activityLevel || '-'}
      Goal: ${profile.goal || '-'}
      Diet: ${profile.dietPref || '-'}
    `;
  }
}