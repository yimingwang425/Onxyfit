import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonSpinner, IonIcon
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, scaleOutline, barbellOutline } from 'ionicons/icons';
import { Chart } from 'chart.js/auto';
import { CheckIn, ProgressService, localDateString } from '../services/progress.service';
import { PlanService } from '../services/plan.service';

interface WeekRow {
  label: string;
  /** Sunday to Saturday; null for days still to come */
  days: (boolean | null)[];
  completed: number;
}

const HISTORY_DAYS = 90;
const WEEKS_SHOWN = 4;

/**
 * The user's check-in history: weight over time, workouts completed week by week,
 * and the individual entries.
 */
@Component({
  selector: 'app-progress',
  templateUrl: './progress.page.html',
  styleUrls: ['./progress.page.scss'],
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonSpinner, IonIcon],
})
export class ProgressPage {
  @ViewChild('weightCanvas') private weightCanvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  loading = true;
  loadError = false;

  weights: { date: string; weight: number }[] = [];
  latestWeight: number | null = null;
  /** Change from the first to the latest weigh-in shown, in kg. */
  weightChange: number | null = null;

  weeks: WeekRow[] = [];
  sessionsPerWeek = 0;
  dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  /** Newest first. */
  entries: CheckIn[] = [];

  constructor(private progressService: ProgressService, private planService: PlanService) {
    addIcons({ checkmarkCircle, scaleOutline, barbellOutline });
  }

  ionViewWillEnter() {
    this.load();
  }

  ionViewWillLeave() {
    this.chart?.destroy();
    this.chart = undefined;
  }

  load() {
    this.loading = true;
    this.loadError = false;
    this.sessionsPerWeek = this.planService.getCurrentPlan()?.details?.sessionsPerWeek ?? 0;

    this.progressService.recent(HISTORY_DAYS).subscribe({
      next: (logs) => {
        this.entries = [...logs].reverse();
        this.weights = logs.filter(l => l.weightKg != null).map(l => ({ date: l.logDate, weight: Number(l.weightKg) }));
        this.latestWeight = this.weights.length > 0 ? this.weights[this.weights.length - 1].weight : null;
        this.weightChange = this.weights.length > 1
          ? Math.round((this.weights[this.weights.length - 1].weight - this.weights[0].weight) * 10) / 10
          : null;
        this.weeks = this.buildWeeks(logs);
        this.loading = false;
        setTimeout(() => this.drawWeightChart(), 50);
      },
      error: () => {
        this.loading = false;
        this.loadError = true;
      }
    });
  }

  /** The last few calendar weeks, newest first, with the days a workout was checked in. */
  private buildWeeks(logs: CheckIn[]): WeekRow[] {
    const done = new Set(logs.filter(l => l.completedWorkout).map(l => l.logDate));
    const today = new Date();
    const todayKey = localDateString(today);
    const rows: WeekRow[] = [];

    for (let w = 0; w < WEEKS_SHOWN; w++) {
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - today.getDay() - 7 * w);
      const days: (boolean | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(sunday);
        date.setDate(sunday.getDate() + d);
        const key = localDateString(date);
        days.push(key > todayKey ? null : done.has(key));
      }
      const saturday = new Date(sunday);
      saturday.setDate(sunday.getDate() + 6);
      rows.push({
        label: w === 0 ? 'This week' : `${this.shortDate(sunday)} – ${this.shortDate(saturday)}`,
        days,
        completed: days.filter(d => d === true).length,
      });
    }
    return rows;
  }

  private shortDate(date: Date): string {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  private drawWeightChart() {
    this.chart?.destroy();
    this.chart = undefined;
    if (!this.weightCanvas || this.weights.length < 2) return;

    this.chart = new Chart(this.weightCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: this.weights.map(w => w.date.slice(5)),
        datasets: [{
          data: this.weights.map(w => w.weight),
          borderColor: '#000',
          backgroundColor: 'rgba(0,0,0,0.06)',
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: '#000',
          tension: 0.3,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: ctx => `${ctx.parsed.y} kg` } },
        },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 6, color: '#999' } },
          y: { ticks: { color: '#999', callback: value => `${value} kg` } },
        },
      },
    });
  }
}
