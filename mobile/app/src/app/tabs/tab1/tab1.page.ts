import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonContent,
  IonIcon, 
  IonSpinner
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline, 
  waterOutline, 
  sparklesOutline,
  happyOutline, 
  barChartOutline, 
  fitnessOutline,
  trendingUpOutline, 
  analyticsOutline, 
  scaleOutline,
  addOutline, 
  calendarOutline,
  barbellOutline
} from 'ionicons/icons';
import { Chart } from 'chart.js/auto';
import { environment } from '../../../environments/environment';
import { UserProfileService } from '../../services/user-profile';
import { PlanService } from '../../services/plan.service';
import { CheckIn, ProgressService, localDateString } from '../../services/progress.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    IonContent, 
    IonIcon, 
    IonSpinner],
})
export class Tab1Page {
  @ViewChild('sparklineCanvas') private sparklineCanvas: ElementRef | undefined;
  @ViewChild('weeklyChartCanvas') private weeklyChartCanvas: ElementRef | undefined;
  @ViewChild('weightChartCanvas') private weightChartCanvas: ElementRef | undefined;

  private weeklyChart: Chart | undefined;

  username = 'User';
  greeting = 'Hello';
  aiTip = '';
  progressData = { completed: 0, total: 0 };
  currentMood: string | null = null;
  currentWater = 0;
  moodEmoji = '';
  weightHistory: { date: string; weight: number }[] = [];
  weightHistoryReversed: { date: string; weight: number }[] = [];
  currentWeight = '';
  waterDots = new Array(8);

  /** Why this week's plan looks the way it does, from the server. */
  planReasons: string[] = [];
  /** Check-ins of the last weeks, oldest first. */
  private checkIns: CheckIn[] = [];
  workoutDoneToday = false;
  todayIsTrainingDay = false;
  weightLoggedToday = false;

  showWeeklyOverlay = false;
  showWeightOverlay = false;

  weekDayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  weekDayDone: boolean[] = [false, false, false, false, false, false, false];
  weekDayToday = new Date().getDay();

  private moodEmojiMap: Record<string, string> = {
    'Energetic': '⚡', 'Neutral': '😊', 'Tired': '😴', 'Stressed': '😰',
  };

  private fallbackTips = [
    'Consistency beats intensity. Show up today and your future self will thank you.',
    'Hydration fuels performance. Aim for at least 8 glasses of water today.',
    'Recovery is where growth happens. Listen to your body and rest when needed.',
  ];

  constructor(
    private alertCtrl: AlertController,
    private http: HttpClient,
    private userProfileService: UserProfileService,
    private planService: PlanService,
    private progressService: ProgressService
  ) {
    addIcons({
      informationCircleOutline, 
      waterOutline, 
      happyOutline,
      sparklesOutline, 
      barChartOutline, 
      fitnessOutline,
      trendingUpOutline, 
      analyticsOutline, 
      scaleOutline,
      calendarOutline, 'add': addOutline, barbellOutline
    });
  }

  ionViewWillEnter() { 
    this.loadDashboardData(); 
  }

  ionViewDidEnter() { 
    this.drawSparkline(); 
  }

  ionViewWillLeave() { 
    this.destroyWeeklyChart(); 
  }

  loadDashboardData() {
    const savedName = localStorage.getItem('user_display_name');
    this.username = savedName || (() => {
      const email = localStorage.getItem('registered_email');
      return email ? email.split('@')[0] : 'User';
    })();

    this.setGreeting();
    this.checkAndResetDailyData();
    this.loadProgressFromAIPlan();
    this.loadWeightHistory();
    this.loadAIInsight();
    this.loadPlanAndCheckIns();
    if (this.currentMood) this.moodEmoji = this.moodEmojiMap[this.currentMood] || '';
  }

  private loadWeightHistory() {
    let history: { date: string; weight: number }[] = [];
    try {
      const raw = localStorage.getItem('weight_history');
      if (raw) history = JSON.parse(raw);
    } catch { }

    this.weightHistory = [...history];
    if (history.length > 0) {
      this.currentWeight = history[history.length - 1].weight.toFixed(1);
      setTimeout(() => this.drawSparkline(), 0);
    }

    this.userProfileService.getProfileData().subscribe({
      next: (data: any) => {
        const profile = Array.isArray(data) && data.length > 0 ? data[0] : data;
        if (!profile) return;
        const w = parseFloat(profile.weightKg);
        if (isNaN(w) || w <= 0) return;

        const today = new Date().toISOString().split('T')[0];
        const last = history.length > 0 ? history[history.length - 1] : null;

        if (!last || Math.abs(last.weight - w) > 0.01) {
          history.push({ date: today, weight: w });
          if (history.length > 30) history = history.slice(-30);
          localStorage.setItem('weight_history', JSON.stringify(history));
        }

        this.weightHistory = [...history];
        this.currentWeight = history[history.length - 1].weight.toFixed(1);
        setTimeout(() => this.drawSparkline(), 200);
      },
      error: () => { }
    });
  }

  private drawSparkline() {
    if (!this.sparklineCanvas || this.weightHistory.length < 1) return;
    const canvas = this.sparklineCanvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const weights = this.weightHistory.map(e => e.weight);

    if (weights.length === 1) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#000';
      ctx.fill();
      return;
    }

    const min = Math.min(...weights) - 0.5, max = Math.max(...weights) + 0.5;
    const range = max - min || 1, pad = 4;
    const points = weights.map((v, i) => ({
      x: pad + (i / (weights.length - 1)) * (w - pad * 2),
      y: pad + (1 - (v - min) / range) * (h - pad * 2),
    }));

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cpx = (points[i - 1].x + points[i].x) / 2;
      ctx.bezierCurveTo(cpx, points[i - 1].y, cpx, points[i].y, points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, h);
    ctx.lineTo(points[0].x, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cpx = (points[i - 1].x + points[i].x) / 2;
      ctx.bezierCurveTo(cpx, points[i - 1].y, cpx, points[i].y, points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    const last = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
  }


  openWeeklyDetail() {
    this.showWeeklyOverlay = true;
    this.computeWeekDays();
    setTimeout(() => this.drawWeeklyDoughnut(), 50);
  }

  /** Which days of the week (0 = Sunday) have a training session in the current plan. */
  private trainingDays(): boolean[] {
    const plan = this.planService.getCurrentPlan();
    if (!plan) return [];
    if (plan.details?.days?.length === 7) {
      return plan.details.days.map(d => d.training);
    }
    const schedules: Record<string, boolean[]> = {
      'PPL': [false, true, true, true, true, true, false],
      'UPPER_LOWER': [false, true, true, true, true, false, false],
      'FBW': [false, true, false, true, false, true, false],
    };
    return schedules[plan.workoutType || 'FBW'] || schedules['FBW'];
  }

  /** Days of this week (Sunday to today) on which a workout was checked in as done. */
  private computeWeekDays() {
    const done = new Array(7).fill(false);
    const today = new Date();
    for (let dow = 0; dow <= today.getDay(); dow++) {
      const date = new Date(today);
      date.setDate(today.getDate() - (today.getDay() - dow));
      const key = localDateString(date);
      done[dow] = this.checkIns.some(c => c.logDate === key && c.completedWorkout);
    }
    this.weekDayDone = done;
  }

  /** Pull this week's plan and the user's check-ins from the server, then refresh what depends on them. */
  private loadPlanAndCheckIns() {
    this.planService.syncFromServer().subscribe({
      next: () => this.applyPlan(),
      error: () => { }
    });
    this.applyPlan();

    this.progressService.recent(90).subscribe({
      next: (logs) => {
        this.checkIns = logs;
        const today = localDateString();
        const todays = logs.find(l => l.logDate === today);
        this.workoutDoneToday = !!todays?.completedWorkout;
        this.weightLoggedToday = todays?.weightKg != null;
        this.loadProgressFromAIPlan();

        const weights = logs.filter(l => l.weightKg != null).map(l => ({ date: l.logDate, weight: Number(l.weightKg) }));
        if (weights.length > 0) {
          this.weightHistory = weights.slice(-30);
          this.currentWeight = weights[weights.length - 1].weight.toFixed(1);
          localStorage.setItem('weight_history', JSON.stringify(this.weightHistory));
          setTimeout(() => this.drawSparkline(), 100);
        }
      },
      error: () => { }
    });
  }

  private applyPlan() {
    const plan = this.planService.getCurrentPlan();
    this.planReasons = plan?.details?.reasons ?? [];
    this.todayIsTrainingDay = this.trainingDays()[new Date().getDay()] ?? false;
    this.loadProgressFromAIPlan();
  }

  toggleWorkoutDone() {
    const done = !this.workoutDoneToday;
    this.progressService.checkIn({ completedWorkout: done }).subscribe({
      next: (log) => {
        this.workoutDoneToday = log.completedWorkout;
        this.upsertCheckIn(log);
        this.loadProgressFromAIPlan();
      },
      error: () => this.showSaveError()
    });
  }

  async logWeight() {
    const alert = await this.alertCtrl.create({
      header: 'Log your weight',
      message: 'Weigh yourself at the same time of day, ideally in the morning. A few weigh-ins a week is enough for your plan to adapt.',
      inputs: [
        { name: 'weight', type: 'number', min: 20, max: 400, placeholder: 'kg', value: this.currentWeight || '' }
      ],
      buttons: [
        { text: 'Cancel' },
        { text: 'Save', handler: (data: { weight: string }) => {
            const weight = Math.round(parseFloat(data.weight) * 10) / 10;
            if (isNaN(weight) || weight < 20 || weight > 400) return false;
            this.progressService.checkIn({ weightKg: weight }).subscribe({
              next: (log) => {
                this.weightLoggedToday = true;
                this.upsertCheckIn(log);
                const history = this.weightHistory.filter(e => e.date !== log.logDate);
                history.push({ date: log.logDate, weight });
                this.weightHistory = history.slice(-30);
                this.currentWeight = weight.toFixed(1);
                localStorage.setItem('weight_history', JSON.stringify(this.weightHistory));
                setTimeout(() => this.drawSparkline(), 100);
              },
              error: () => this.showSaveError()
            });
            return true;
        }},
      ],
    });
    await alert.present();
  }

  private upsertCheckIn(log: CheckIn) {
    this.checkIns = [...this.checkIns.filter(c => c.logDate !== log.logDate), log];
  }

  private async showSaveError() {
    const alert = await this.alertCtrl.create({
      header: 'Not saved',
      message: 'Could not save your check-in. Please check your connection and try again.',
      buttons: ['OK']
    });
    await alert.present();
  }

  private drawWeeklyDoughnut() {
    if (!this.weeklyChartCanvas || this.progressData.total === 0) return;
    this.destroyWeeklyChart();
    const ctx = this.weeklyChartCanvas.nativeElement.getContext('2d');
    const remaining = this.progressData.total - this.progressData.completed;
    this.weeklyChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [this.progressData.completed, remaining > 0 ? remaining : 0],
          backgroundColor: ['#000000', '#F0F0F0'],
          borderColor: '#fff', borderWidth: 3
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } }, cutout: '72%' }
    });
  }

  private destroyWeeklyChart() {
    if (this.weeklyChart) { this.weeklyChart.destroy(); this.weeklyChart = undefined; }
  }

  openWeightDetail() {
    this.weightHistoryReversed = [...this.weightHistory].reverse();
    this.showWeightOverlay = true;
    setTimeout(() => this.drawWeightDetailChart(), 50);
  }

  private drawWeightDetailChart() {
    if (!this.weightChartCanvas || this.weightHistory.length < 1) return;
    const canvas = this.weightChartCanvas.nativeElement as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.scale(dpr, dpr);
    const w = rect.width, h = rect.height;
    const weights = this.weightHistory.map(e => e.weight);
    if (weights.length === 1) {
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#000'; ctx.fill(); return;
    }
    const min = Math.min(...weights) - 1, max = Math.max(...weights) + 1;
    const range = max - min || 1, pad = 8;
    const points = weights.map((v, i) => ({
      x: pad + (i / (weights.length - 1)) * (w - pad * 2),
      y: pad + (1 - (v - min) / range) * (h - pad * 2),
    }));
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0.06)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cpx = (points[i - 1].x + points[i].x) / 2;
      ctx.bezierCurveTo(cpx, points[i - 1].y, cpx, points[i].y, points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, h); ctx.lineTo(points[0].x, h);
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const cpx = (points[i - 1].x + points[i].x) / 2;
      ctx.bezierCurveTo(cpx, points[i - 1].y, cpx, points[i].y, points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.stroke();
    points.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, i === points.length - 1 ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = '#000'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, i === points.length - 1 ? 3 : 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fff'; ctx.fill();
    });
  }


  private checkAndResetDailyData() {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastLogDate = localStorage.getItem('last_log_date');
    if (lastLogDate !== todayStr) {
      localStorage.removeItem('today_mood');
      localStorage.removeItem('today_water');
      localStorage.setItem('last_log_date', todayStr);
      this.currentMood = null;
      this.currentWater = 0;
    } else {
      this.currentMood = localStorage.getItem('today_mood');
      this.currentWater = parseInt(localStorage.getItem('today_water') || '0', 10);
    }
    this.moodEmoji = this.currentMood ? (this.moodEmojiMap[this.currentMood] || '') : '';
  }

  private setGreeting() {
    const h = new Date().getHours();
    this.greeting = h < 12 ? 'Good Morning' : h < 18 ? 'Good Afternoon' : 'Good Evening';
  }

  /** Workouts checked in as done this week, out of the sessions the plan schedules. */
  private loadProgressFromAIPlan() {
    const total = this.trainingDays().filter(d => d).length;
    if (total === 0) {
      this.progressData = { completed: 0, total: 0 };
      return;
    }
    this.computeWeekDays();
    this.progressData = { completed: this.weekDayDone.filter(d => d).length, total };
  }

  private loadAIInsight() {
    this.aiTip = this.fallbackTips[Math.floor(Math.random() * this.fallbackTips.length)];

    const planStr = localStorage.getItem('current_ai_plan');
    let context: any = { 
      mood: this.currentMood || 'Not logged', 
      water: this.currentWater 
    };

    if (planStr) {
      try {
        const plan = JSON.parse(planStr);
        context.calories = plan.caloriesKcal;
        context.workoutType = plan.workoutType;

        const schedules: Record<string, string[]> = {
          'PPL': ['Rest', 'Push Day', 'Pull Day', 'Leg Day', 'Push Day', 'Pull Day', 'Rest'],
          'UPPER_LOWER': ['Rest', 'Upper Body', 'Lower Body', 'Rest', 'Upper Body', 'Lower Body', 'Rest'],
          'FBW': ['Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest'],
        };
        context.workout = plan.details?.days?.[new Date().getDay()]?.session
          ?? (schedules[plan.workoutType] || schedules['FBW'])[new Date().getDay()];
      } catch { }
    }
    this.http.post<{ insight: string }>(`${environment.apiUrl}/insight`, context)
    .subscribe({
      next: (res) => { 
        if (res.insight) this.aiTip = res.insight; 
      },
      error: () => { }
    });
  }

  async logMood() {
    const alert = await this.alertCtrl.create({
      header: 'How are you feeling?',
      inputs: [
        { type: 'radio', label: '⚡ Energetic', value: 'Energetic' },
        { type: 'radio', label: '😊 Neutral', value: 'Neutral' },
        { type: 'radio', label: '😴 Tired', value: 'Tired' },
        { type: 'radio', label: '😰 Stressed', value: 'Stressed' },
      ],
      buttons: [
        { text: 'Cancel' },
        { text: 'Save', handler: (data: string) => {
            if (data) {
              this.currentMood = data;
              this.moodEmoji = this.moodEmojiMap[data] || '';
              localStorage.setItem('today_mood', data);
              localStorage.setItem('last_log_date', new Date().toISOString().split('T')[0]);
              this.loadAIInsight();
            }
        }},
      ],
    });
    await alert.present();
  }

  async logWater() {
    const alert = await this.alertCtrl.create({
      header: 'Log Water Intake',
      message: 'How many glasses are you adding?',
      inputs: [
        { 
        name: 'water', 
        type: 'number', 
        min: 1, 
        value: 1 }
      ],
      buttons: [
        { text: 'Cancel' },
        { text: 'Add', handler: (data: { water: string }) => {
            const glasses = parseInt(data.water, 10);
            if (glasses > 0) {
              this.currentWater += glasses;
              localStorage.setItem('today_water', this.currentWater.toString());
              localStorage.setItem('last_log_date', new Date().toISOString().split('T')[0]);
              this.loadAIInsight();
            }
        }},
      ],
    });
    await alert.present();
  }
}