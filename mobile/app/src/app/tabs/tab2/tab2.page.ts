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
  IonList,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonChip,
  IonSpinner,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { restaurantOutline } from 'ionicons/icons';

import {
  MealPlanService,
  DailyPlan,
  WeeklyPlan,
  Meal,
} from '../../services/meal-plan';
import { MealDetailComponent } from '../../components/meal-detail/meal-detail.component';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
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
    IonList,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonChip,
    IonSpinner,
    IonIcon,
    MealDetailComponent,
  ],
})
export class Tab2Page implements OnInit {
  currentSegment = 'today';

  isLoadingToday = false;
  isLoadingWeek = false;

  todaysPlan: DailyPlan | null = null;
  weeklyPlan: WeeklyPlan[] = [];

  selectedDayIndex: number = 0;

  constructor(
    private mealPlanService: MealPlanService,
    private modalCtrl: ModalController
  ) {
    addIcons({ restaurantOutline });
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
    this.mealPlanService.getTodaysPlan().subscribe((data) => {
      this.todaysPlan = data;
      this.isLoadingToday = false;
    });
  }

  loadWeeklyPlan() {
    this.isLoadingWeek = true;
    this.mealPlanService.getWeeklyPlan().subscribe((data) => {
      this.weeklyPlan = data;
      this.selectedDayIndex = data.findIndex(day => day.plan !== null);
      if (this.selectedDayIndex === -1) this.selectedDayIndex = 0;
      
      this.isLoadingWeek = false;
    });
  }

  selectDay(index: number) {
    this.selectedDayIndex = index;
  }

  async openMealDetails(meal: Meal | null) {
    if (!meal) {
      return;
    }

    const modal = await this.modalCtrl.create({
      component: MealDetailComponent,
      componentProps: {
        meal: meal,
      },
    });
    await modal.present();
  }

  get selectedDayPlan(): DailyPlan | null {
    if (this.weeklyPlan.length > 0 && this.selectedDayIndex !== -1) {
      return this.weeklyPlan[this.selectedDayIndex]?.plan;
    }
    return null;
  }
}