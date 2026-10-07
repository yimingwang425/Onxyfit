import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/** One day of tracking, as stored on the server. */
export interface CheckIn {
  id?: number;
  /** yyyy-MM-dd */
  logDate: string;
  weightKg?: number | null;
  completedWorkout: boolean;
}

/** A date as yyyy-MM-dd in the device's own time zone (toISOString would give the UTC day). */
export function localDateString(date: Date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * Daily check-ins: body weight and whether the day's workout was done. The server uses them
 * each week to adjust the next plan.
 */
@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private readonly endpoint = `${environment.apiUrl}/progress-logs`;

  constructor(private http: HttpClient) {}

  /** Record today's weight and/or workout; whatever is left out keeps its stored value. */
  checkIn(data: { weightKg?: number; completedWorkout?: boolean }): Observable<CheckIn> {
    return this.http.put<CheckIn>(`${this.endpoint}/today`, { ...data, logDate: localDateString() });
  }

  /** Check-ins of the last `days` days, oldest first. */
  recent(days = 28): Observable<CheckIn[]> {
    return this.http.get<CheckIn[]>(`${this.endpoint}/recent`, { params: { days } });
  }
}
