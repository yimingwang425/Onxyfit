import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface AIPlan {
  id?: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  workoutType: 'FBW' | 'UPPER_LOWER' | 'PPL';
  workoutIntensity: number;
  source?: string;
  createdAt?: string;
  mealPlan?: {
    breakfast: any;
    lunch: any;
    dinner: any;
    snack: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private readonly endpoint = `${environment.apiUrl}/plans/generate`;

  constructor(private http: HttpClient) {}

  generatePlan(): Observable<AIPlan> {
    const token = localStorage.getItem('authenticationToken') || localStorage.getItem('auth_token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.post<AIPlan>(this.endpoint, {}, { headers }).pipe(
      tap(plan => {
        console.log('AI Plan generated:', plan);
        localStorage.setItem('current_ai_plan', JSON.stringify(plan));
      })
    );
  }

  getCurrentPlan(): AIPlan | null {
    const plan = localStorage.getItem('current_ai_plan');
    return plan ? JSON.parse(plan) : null;
  }

  clearPlan(): void {
    localStorage.removeItem('current_ai_plan');
  }
}