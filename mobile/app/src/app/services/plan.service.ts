import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, finalize, shareReplay, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { localDateString } from './progress.service';

/** Targets for one day of the week (0 = Sunday). */
export interface PlanDay {
  day: number;
  training: boolean;
  session: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

/** How the plan was derived, including what was learned from the user's check-ins. */
export interface PlanDetails {
  formulaMaintenanceKcal: number;
  maintenanceKcal: number;
  calorieAdjustmentKcal: number;
  trainingOffset: number;
  sessionsPerWeek: number;
  sessionKcal: number;
  days: PlanDay[];
  reasons: string[];
  /** Volume is reduced this week because the user reported being run down. */
  recoveryWeek?: boolean;
  /** What the user asked for this week only. */
  weekConstraint?: { maxSessions?: number | null; avoid?: 'UPPER' | 'LOWER' | null } | null;
}

export interface AIPlan {
  id?: number;
  caloriesKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  workoutType?: 'FBW' | 'UPPER_LOWER' | 'PPL' | 'CARDIO_MIX';
  workoutIntensity: number;
  source?: string;
  createdAt?: string;
  mealPlanJson?: string;
  workoutPlanJson?: string;
  weekStartDate?: string;
  details?: PlanDetails;
  /** What happened last week and what it changed, written by the server. */
  weeklyReport?: string;
  /** After a request that tried to generate meals: 'ok', or why there are none. */
  mealStatus?: 'ok' | 'llm_unavailable' | 'invalid_response' | 'restrictions';
}

const PLAN_KEY = 'current_ai_plan';
/** The local day on which the stored plan was last checked against the server. */
const SYNCED_KEY = 'plan_synced_on';
/** Set when the stored plan was discarded on purpose and a new one must be generated. */
const REGENERATE_KEY = 'plan_regenerate';
/** The server replaces plans every week; one older than this means that didn't happen. */
const MAX_PLAN_AGE_DAYS = 8;

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private readonly endpoint = `${environment.apiUrl}/plans`;

  /** Goes up every time the stored plan is replaced; pages compare it to know theirs is stale. */
  version = 0;

  /** A load or generation already under way, shared so tabs don't each start their own. */
  private inFlight: Observable<AIPlan> | null = null;

  constructor(private http: HttpClient) {}

  /**
   * The user's current plan. The copy on this device is used for the rest of the day once it has
   * been checked against the server, so the plan the server builds each week (adjusted to the
   * user's check-ins) is picked up. A plan is generated only when the user has none, when theirs
   * is clearly out of date, or after clearPlan().
   */
  loadPlan(): Observable<AIPlan> {
    const cached = this.getCurrentPlan();
    if (cached && this.isSyncedToday()) {
      return of(cached);
    }
    if (this.inFlight) {
      return this.inFlight;
    }

    const source = localStorage.getItem(REGENERATE_KEY)
      ? this.generatePlan()
      : this.http.get<AIPlan>(`${this.endpoint}/current`, { headers: this.authHeaders() }).pipe(
          switchMap(plan => {
            if (this.isOutdated(plan)) {
              return this.generatePlan();
            }
            this.store(plan);
            // Plans made by the weekly run for someone who was away come without meals
            return plan.mealPlanJson ? of(plan) : this.regenerateMeals().pipe(catchError(() => of(plan)));
          }),
          catchError(err => {
            if (err.status === 404) {
              return this.generatePlan();
            }
            // Offline or server trouble: keep showing what we have
            return cached ? of(cached) : throwError(() => err);
          })
        );

    this.inFlight = source.pipe(
      finalize(() => (this.inFlight = null)),
      shareReplay(1)
    );
    return this.inFlight;
  }

  /**
   * Bring the stored plan up to date if the server has one, without ever generating.
   * Emits null when the user has no plan yet.
   */
  syncFromServer(): Observable<AIPlan | null> {
    const cached = this.getCurrentPlan();
    if (localStorage.getItem(REGENERATE_KEY)) {
      return of(null);
    }
    if (cached && localStorage.getItem(SYNCED_KEY) === localDateString()) {
      return of(cached);
    }
    return this.http.get<AIPlan>(`${this.endpoint}/current`, { headers: this.authHeaders() }).pipe(
      tap(plan => this.store(plan)),
      catchError(() => of(cached))
    );
  }

  generatePlan(): Observable<AIPlan> {
    return this.http.post<AIPlan>(`${this.endpoint}/generate`, {}, { headers: this.authHeaders() }).pipe(
      tap(plan => this.store(plan))
    );
  }

  /** Generate meals for the current plan, leaving its targets and training untouched. */
  regenerateMeals(): Observable<AIPlan> {
    return this.http.post<AIPlan>(`${this.endpoint}/current/meals`, {}, { headers: this.authHeaders() }).pipe(
      tap(plan => this.store(plan))
    );
  }

  /** Turn down the lighter training week given for feeling run down, and train as usual. */
  keepUsualTrainingVolume(): Observable<AIPlan> {
    return this.http.post<AIPlan>(`${this.endpoint}/current/keep-usual-volume`, {}, { headers: this.authHeaders() }).pipe(
      tap(plan => this.store(plan))
    );
  }

  getCurrentPlan(): AIPlan | null {
    try {
      const plan = localStorage.getItem(PLAN_KEY);
      return plan ? JSON.parse(plan) : null;
    } catch {
      return null;
    }
  }

  /** Whether a plan is stored and has been checked against the server today. */
  isSyncedToday(): boolean {
    return this.getCurrentPlan() !== null && localStorage.getItem(SYNCED_KEY) === localDateString();
  }

  /** Drop the stored plan; the next loadPlan() generates a new one. */
  clearPlan(): void {
    localStorage.removeItem(PLAN_KEY);
    localStorage.removeItem(SYNCED_KEY);
    localStorage.setItem(REGENERATE_KEY, '1');
  }

  /** Take a plan the server just returned (for example after the assistant changed it) as the current one. */
  adopt(plan: AIPlan): void {
    this.store(plan);
  }

  private store(plan: AIPlan): void {
    this.version++;
    localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
    localStorage.setItem(SYNCED_KEY, localDateString());
    localStorage.removeItem(REGENERATE_KEY);
  }

  private isOutdated(plan: AIPlan): boolean {
    if (!plan.createdAt) return false;
    const ageDays = (Date.now() - new Date(plan.createdAt).getTime()) / 86_400_000;
    return ageDays > MAX_PLAN_AGE_DAYS;
  }

  private authHeaders(): HttpHeaders {
    const token = localStorage.getItem('authenticationToken');
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }
}
