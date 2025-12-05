import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type UserProfileDto = {
  id?: number;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';
  goal: 'LOSE' | 'MAINTAIN' | 'GAIN';
  dietPref: 'BALANCED' | 'HIGH_PROTEIN' | 'VEGETARIAN' | 'NO_PREFERENCE';
  metabolicProfile?: 'PROFILE_1' | 'PROFILE_2'; 
  createdAt?: string;
  user?: any;
};

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {
  private useMock = false;
  
  private readonly endpoint = `${environment.apiUrl}/user-profiles`;

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

  saveProfile(profile: UserProfileDto): Observable<any> {
    if (this.useMock) {
      return of({ success: true, data: profile }).pipe(
        delay(600),
        tap(() => {
           const current = this.getProfile() || {};
           const updated = { ...current, ...profile };
           console.log('Profile Saved to LocalStorage:', updated);
           localStorage.setItem('user_profile', JSON.stringify(updated));
        })
      );
    } else {
      const token = localStorage.getItem('authenticationToken') || localStorage.getItem('auth_token');
      let headers = new HttpHeaders();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }

      if (profile.id) {
        console.log('Updating Profile (PUT), ID:', profile.id);
        return this.http.put<any>(`${this.endpoint}/${profile.id}`, profile, { headers });
      } else {
        console.log('Creating new Profile (POST)');
        return this.http.post<any>(this.endpoint, profile, { headers });
      }
    }
  }

  getProfileData(): Observable<any> {
      const token = localStorage.getItem('authenticationToken') || localStorage.getItem('auth_token');
      let headers = new HttpHeaders();
      if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
      }
      return this.http.get<any>(this.endpoint, { headers });
  }

  getProfile(): UserProfileDto | null {
    const p = localStorage.getItem('user_profile');
    return p ? JSON.parse(p) : null;
  }

  getMissingFields(profile?: any): string[] {
    const target = profile || this.getProfile();
    
    if (!target) {
      return Object.values(this.fieldLabels);
    }

    const missing: string[] = [];
    this.requiredFields.forEach(key => {
      const val = target[key];
      if (val === null || val === undefined || val === '') {
        missing.push(this.fieldLabels[key as string]);
      }
    });
    
    return missing;
  }

  getSummaryString(profile?: any): string {
    const target = profile || this.getProfile();
    if (!target) return 'No information available';

    const age = target.age;
    const height = target.heightCm || target.height;
    const weight = target.weightKg || target.weight;
    const act = target.activityLevel;
    const goal = target.goal;
    const diet = target.dietPref;

    return `
      Age: ${age || '-'}
      Height: ${height || '-'} cm
      Weight: ${weight || '-'} kg
      Activity: ${act || '-'}
      Goal: ${goal || '-'}
      Diet: ${diet || '-'}
    `;
  }
}