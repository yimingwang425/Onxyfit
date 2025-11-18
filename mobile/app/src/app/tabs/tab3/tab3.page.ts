import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonChip,
  IonSpinner,
  IonIcon,
  ModalController,
  IonItem,
  IonList,
  IonListHeader,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, moonOutline } from 'ionicons/icons';

import {
  WorkoutPlanService,
  DailyWorkoutPlan,
  WeeklyWorkoutPlan,
  Exercise,
} from '../../services/workout-plan';
import { WorkoutDetailComponent } from '../../components/workout-detail/workout-detail.component';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonChip,
    IonSpinner,
    IonIcon,
    IonItem,
    IonList,
    IonListHeader,
    WorkoutDetailComponent,
  ],
})
export class Tab3Page implements OnInit {
  currentSegment = 'today';

  isLoadingToday = false;
  isLoadingWeek = false;

  todaysPlan: DailyWorkoutPlan | null = null;
  weeklyPlan: WeeklyWorkoutPlan[] = [];

  selectedDayIndex: number = 0;

  constructor(
    private workoutPlanService: WorkoutPlanService,
    private modalCtrl: ModalController
  ) {
    addIcons({ barbellOutline, moonOutline });
  }

  ngOnInit() {
    this.loadTodaysPlan();
  }

  segmentChanged(event: any) {
    this.currentSegment = event.detail.value;

    if (this.currentSegment === 'week' && this.weeklyPlan.length === 0) {
      this.loadWeeklyPlan();
    }
  }

  loadTodaysPlan() {
    this.isLoadingToday = true;
    this.workoutPlanService.getTodaysPlan().subscribe((data) => {
      this.todaysPlan = data;
      this.isLoadingToday = false;
    });
  }

  loadWeeklyPlan() {
    this.isLoadingWeek = true;
    this.workoutPlanService.getWeeklyPlan().subscribe((data) => {
      this.weeklyPlan = data;
      this.selectedDayIndex = 0;
      this.isLoadingWeek = false;
    });
  }

  selectDay(index: number) {
    this.selectedDayIndex = index;
  }

  async openWorkoutDetails(exercise: Exercise | null) {
    if (!exercise) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: WorkoutDetailComponent,
      componentProps: {
        exercise: exercise,
      },
    });
    await modal.present();
  }

  get selectedDayPlan(): DailyWorkoutPlan | null {
    if (this.weeklyPlan.length > 0) {
      return this.weeklyPlan[this.selectedDayIndex]?.plan;
    }
    return null;
  }

  get selectedDayTitle(): string {
    if (this.weeklyPlan.length > 0) {
      return this.weeklyPlan[this.selectedDayIndex]?.planTitle;
    }
    return '';
  }
}