import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileCheckModalComponent } from '../../components/profile-check-modal/profile-check-modal.component';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
  IonLabel, IonList, IonItem, IonIcon, IonSpinner, ModalController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  restaurantOutline, sunnyOutline, moonOutline, cafeOutline, 
  chevronForward, cartOutline, restaurant
} from 'ionicons/icons';

import { MealPlanService, DailyPlan, WeeklyPlan, Meal } from '../../services/meal-plan';
import { MealDetailComponent } from '../../components/meal-detail/meal-detail.component';
import { UserProfileService } from '../../services/user-profile';
import { ALLERGY_DISCLAIMER, HEALTH_DISCLAIMER_SHORT } from '../../services/dietary';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonSegment, IonSegmentButton, IonLabel, IonList, IonItem, IonIcon,
    IonSpinner, MealDetailComponent,
  ],
})
export class Tab2Page implements OnInit {
  currentSegment = 'today';
  isLoadingToday = false;
  isLoadingWeek = false;
  todaysPlan: DailyPlan | null = null;
  weeklyPlan: WeeklyPlan[] = [];
  selectedDayIndex: number = 0;
  disclaimer = `${HEALTH_DISCLAIMER_SHORT} ${ALLERGY_DISCLAIMER}`;
  /** The plan could not be loaded at all (offline, server error). */
  loadError = false;
  /** The version of the stored plan that is on screen. */
  private shownPlanVersion = -1;
  todayDow = new Date().getDay();

  constructor(
    private mealPlanService: MealPlanService,
    private modalCtrl: ModalController,
    private navCtrl: NavController,
    private profileService: UserProfileService
  ) {
    addIcons({ restaurantOutline, sunnyOutline, moonOutline, cafeOutline, chevronForward, cartOutline, restaurant });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    // The stored plan was dropped (e.g. allergies changed) or may have been replaced by this
    // week's plan on the server: forget what is on screen so it is loaded again
    if (!this.mealPlanService.hasFreshPlan() || this.shownPlanVersion !== this.mealPlanService.planVersion) {
      this.todaysPlan = null;
      this.weeklyPlan = [];
    }
    this.checkProfileAndLoad();
  }

  /** Try again after meals could not be generated, or after the plan failed to load. */
  retry() {
    this.loadError = false;
    this.todaysPlan = null;
    this.weeklyPlan = [];
    if (this.currentSegment === 'today') { this.isLoadingToday = true; } else { this.isLoadingWeek = true; }
    this.mealPlanService.retryMeals().subscribe({
      next: () => this.loadData(),
      // loadData() surfaces the error state itself if the plan still can't be had
      error: () => this.loadData()
    });
  }

  async checkProfileAndLoad() {
    this.profileService.getProfileData().subscribe({
      next: async (data: any) => {
        let profile = null;
        if (Array.isArray(data) && data.length > 0) {
          profile = data[0];
        }

        const missingFields = this.profileService.getMissingFields(profile);
        
        if (missingFields.length > 0) {
          const modal = await this.modalCtrl.create({
            component: ProfileCheckModalComponent,
            componentProps: { mode: 'missing', missingFields: missingFields },
            backdropDismiss: false,
          });
          await modal.present();
          const { role } = await modal.onWillDismiss();
          if (role === 'complete') {
            this.navCtrl.navigateForward('/auth/user-profile-setup?from=missing');
          }
          return; 
        }

        const hasConfirmed = localStorage.getItem('has_confirmed_plan_start');
        if (!hasConfirmed) {
          const summary = this.profileService.getSummaryString(profile);
          const modal = await this.modalCtrl.create({
            component: ProfileCheckModalComponent,
            componentProps: { mode: 'confirm', summary: summary },
            backdropDismiss: false
          });
          await modal.present();
          const { role } = await modal.onWillDismiss();
          if (role === 'edit') {
            this.navCtrl.navigateForward('/auth/user-profile-setup?from=review');
          } else if (role === 'confirm') {
            localStorage.setItem('has_confirmed_plan_start', 'true');
            this.loadData();
          }
        } else {
          this.loadData();
        }
      },
      error: (err) => {
        console.error('Tab2: Unable to retrieve user information', err);
      }
    });
  }

  loadData() {
    if (this.currentSegment === 'today' && !this.todaysPlan) {
        this.loadTodaysPlan();
    } else if (this.currentSegment === 'week' && this.weeklyPlan.length === 0) {
        this.loadWeeklyPlan();
    }
  }

  segmentChanged(event: any) {
    this.currentSegment = event.detail.value;
    if (this.currentSegment === 'week' && this.weeklyPlan.length === 0) {
      this.loadWeeklyPlan();
    }
  }

  loadTodaysPlan() {
    this.isLoadingToday = true;
    this.loadError = false;
    this.mealPlanService.getTodaysPlan().subscribe({
      next: (data) => {
        this.todaysPlan = data;
        this.shownPlanVersion = this.mealPlanService.planVersion;
        this.isLoadingToday = false;
      },
      error: () => {
        this.isLoadingToday = false;
        this.loadError = true;
      }
    });
  }

  loadWeeklyPlan() {
    this.isLoadingWeek = true;
    this.loadError = false;
    this.mealPlanService.getWeeklyPlan().subscribe({
      next: (data) => {
        this.weeklyPlan = data;
        this.shownPlanVersion = this.mealPlanService.planVersion;
        const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const todayStr = daysMap[new Date().getDay()]; 
        const foundIndex = data.findIndex(d => d.day === todayStr);
        if (foundIndex !== -1) {
          this.selectedDayIndex = foundIndex;
        } else {
          this.selectedDayIndex = 0;
        }
        this.isLoadingWeek = false;
      },
      error: () => {
        this.isLoadingWeek = false;
        this.loadError = true;
      }
    });
  }

  selectDay(index: number) {
    this.selectedDayIndex = index;
  }

  /** The day of the week (0 = Sunday) selected in the weekly view. */
  get selectedDow(): number {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days.indexOf(this.weeklyPlan[this.selectedDayIndex]?.day ?? '');
  }

  /**
   * @param slot and day say which meal of the plan this is, so the assistant can be asked to change it
   */
  async openMealDetails(meal: Meal | null, slot?: string, day?: number) {
    if (!meal) return;
    const modal = await this.modalCtrl.create({
      component: MealDetailComponent,
      componentProps: { meal: meal, slot: slot, day: day },
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