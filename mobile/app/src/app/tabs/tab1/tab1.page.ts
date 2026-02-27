import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonList,
  IonListHeader,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  waterOutline,
  sparklesOutline,
  happyOutline,
  barChartOutline
} from 'ionicons/icons';
import { Chart } from 'chart.js/auto';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonText,
    IonSpinner
  ],
})
export class Tab1Page {
  @ViewChild('progressChartCanvas') private progressChartCanvas: ElementRef | undefined;
  private progressChart: Chart | undefined;

  // Flask ML service URL
  private flaskUrl = environment.apiUrl.replace(/:\d+\/api$/, ':5001');

  username = 'User';
  greeting = 'Hello';
  aiTip = '';
  progressData = { completed: 0, total: 0 };
  currentMood: string | null = null;
  currentWater = 0;

  private fallbackTips = [
    'Consistency beats intensity. Show up today and your future self will thank you.',
    'Hydration fuels performance. Aim for at least 8 glasses of water today.',
    'Recovery is where growth happens. Listen to your body and rest when needed.',
  ];

  constructor(
    private alertCtrl: AlertController,
    private http: HttpClient
  ) {
    addIcons({
      informationCircleOutline,
      waterOutline,
      happyOutline,
      sparklesOutline,
      barChartOutline
    });
  }

  ionViewWillEnter() {
    this.loadDashboardData();
  }

  ionViewDidEnter() {
    this.createChart();
  }

  ionViewWillLeave() {
    this.destroyChart();
  }

  loadDashboardData() {
    const email = localStorage.getItem('registered_email');
    this.username = email ? email.split('@')[0] : 'User';

    this.setGreeting();
    this.checkAndResetDailyData();
    this.loadProgressFromAIPlan();
    this.loadAIInsight();

    setTimeout(() => {
      this.createChart();
    }, 0);
  }

  private checkAndResetDailyData() {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastLogDate = localStorage.getItem('last_log_date');

    if (lastLogDate !== todayStr) {
      console.log('New day detected, resetting daily logs.');
      localStorage.removeItem('today_mood');
      localStorage.removeItem('today_water');
      localStorage.setItem('last_log_date', todayStr);
      this.currentMood = null;
      this.currentWater = 0;
    } else {
      this.currentMood = localStorage.getItem('today_mood');
      this.currentWater = parseInt(localStorage.getItem('today_water') || '0', 10);
    }
  }

  private setGreeting() {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      this.greeting = 'Good Morning';
    } else if (currentHour < 18) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }

  private loadProgressFromAIPlan() {
    const planStr = localStorage.getItem('current_ai_plan');
    if (!planStr) {
      this.progressData = { completed: 0, total: 0 };
      return;
    }

    try {
      const plan = JSON.parse(planStr);
      const workoutType = plan.workoutType || 'FBW';

      const schedules: Record<string, boolean[]> = {
        'PPL':         [false, true, true, true, true, true, false],
        'UPPER_LOWER': [false, true, true, false, true, true, false],
        'FBW':         [false, true, false, true, false, true, false],
      };

      const schedule = schedules[workoutType] || schedules['FBW'];
      const total = schedule.filter(d => d).length;

      const today = new Date().getDay(); // 0=Sun ... 6=Sat
      let completed = 0;
      for (let i = 1; i < today; i++) {
        if (schedule[i]) completed++;
      }

      this.progressData = { completed, total };
    } catch {
      this.progressData = { completed: 0, total: 0 };
    }
  }

  private loadAIInsight() {
    this.aiTip = this.fallbackTips[Math.floor(Math.random() * this.fallbackTips.length)];

    const planStr = localStorage.getItem('current_ai_plan');
    let context: any = {
      mood: this.currentMood || 'Not logged',
      water: this.currentWater,
    };

    if (planStr) {
      try {
        const plan = JSON.parse(planStr);
        context.calories = plan.caloriesKcal;
        context.workoutType = plan.workoutType;

        const schedules: Record<string, string[]> = {
          'PPL':         ['Rest', 'Push Day', 'Pull Day', 'Leg Day', 'Push Day', 'Pull Day', 'Rest'],
          'UPPER_LOWER': ['Rest', 'Upper Body', 'Lower Body', 'Rest', 'Upper Body', 'Lower Body', 'Rest'],
          'FBW':         ['Rest', 'Full Body', 'Rest', 'Full Body', 'Rest', 'Full Body', 'Rest'],
        };
        const todaySchedule = schedules[plan.workoutType] || schedules['FBW'];
        context.workout = todaySchedule[new Date().getDay()];
      } catch { }
    }

    this.http.post<{ insight: string }>(`${this.flaskUrl}/api/insight`, context)
      .subscribe({
        next: (res) => {
          if (res.insight) {
            this.aiTip = res.insight;
          }
        },
        error: () => {
        }
      });
  }

  createChart() {
    if (!this.progressChartCanvas || this.progressData.total === 0) {
      return;
    }

    if (this.progressChart) {
      this.progressChart.destroy();
    }

    const ctx = this.progressChartCanvas.nativeElement.getContext('2d');
    const remaining = this.progressData.total - this.progressData.completed;

    this.progressChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Completed', 'Remaining'],
        datasets: [{
          data: [this.progressData.completed, remaining > 0 ? remaining : 0],
          backgroundColor: ['#3880ff', '#f0f2f5'],
          borderColor: '#ffffff',
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true }
        },
        cutout: '70%'
      }
    });
  }

  private destroyChart() {
    if (this.progressChart) {
      this.progressChart.destroy();
      this.progressChart = undefined;
    }
  }

  async logMood() {
    const alert = await this.alertCtrl.create({
      header: 'How are you feeling?',
      inputs: [
        { type: 'radio', label: 'Energetic', value: 'Energetic' },
        { type: 'radio', label: 'Neutral', value: 'Neutral' },
        { type: 'radio', label: 'Tired', value: 'Tired' },
        { type: 'radio', label: 'Stressed', value: 'Stressed' },
      ],
      buttons: [
        { text: 'Cancel' },
        {
          text: 'Save',
          handler: (data: string) => {
            if (data) {
              this.currentMood = data;
              localStorage.setItem('today_mood', data);
              localStorage.setItem('last_log_date', new Date().toISOString().split('T')[0]);
              this.saveMoodToBackend(data);
              this.loadAIInsight();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async logWater() {
    const alert = await this.alertCtrl.create({
      header: 'Log Water Intake',
      message: 'How many glasses of water are you logging?',
      inputs: [
        {
          name: 'water',
          type: 'number',
          min: 1,
          value: 1,
        },
      ],
      buttons: [
        { text: 'Cancel' },
        {
          text: 'Add',
          handler: (data: { water: string }) => {
            const glasses = parseInt(data.water, 10);
            if (glasses > 0) {
              this.currentWater += glasses;
              localStorage.setItem('today_water', this.currentWater.toString());
              localStorage.setItem('last_log_date', new Date().toISOString().split('T')[0]);
              this.saveWaterToBackend(this.currentWater);
              this.loadAIInsight();
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async showMoodInfo() {
    const alert = await this.alertCtrl.create({
      header: 'Why track mood?',
      message: 'Your mood, energy, and stress levels are key indicators of recovery. Your AI coach uses this data to recommend when to push harder and when to focus on recovery.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  async showWaterInfo() {
    const alert = await this.alertCtrl.create({
      header: 'Why track water?',
      message: 'Proper hydration is crucial for muscle repair, energy levels, and nutrient transport. Tracking your intake helps ensure your body has what it needs to perform at its best.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private saveMoodToBackend(mood: string) {
    console.log('TODO: Calling backend API: POST /api/progress/mood', {
      date: new Date().toISOString().split('T')[0],
      mood: mood
    });
  }

  private saveWaterToBackend(totalGlasses: number) {
    console.log('TODO: Calling backend API: POST /api/progress/water', {
      date: new Date().toISOString().split('T')[0],
      glasses: totalGlasses
    });
  }
}