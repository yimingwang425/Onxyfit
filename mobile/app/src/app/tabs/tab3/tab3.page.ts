import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileCheckModalComponent } from '../../components/profile-check-modal/profile-check-modal.component';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonSegment, IonSegmentButton,
  IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonChip,
  IonSpinner, IonIcon, ModalController, IonItem, IonList, IonListHeader,
  AlertController, NavController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { barbellOutline, moonOutline } from 'ionicons/icons';

import { WorkoutPlanService, DailyWorkoutPlan, WeeklyWorkoutPlan, Exercise } from '../../services/workout-plan';
import { WorkoutDetailComponent } from '../../components/workout-detail/workout-detail.component';
import { UserProfileService } from '../../services/user-profile';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent,
    IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardHeader, IonCardTitle,
    IonCardSubtitle, IonChip, IonSpinner, IonIcon, IonItem, IonList, IonListHeader,
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
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private profileService: UserProfileService
  ) {
    addIcons({ barbellOutline, moonOutline });
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.checkProfileAndLoad();
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
        console.error('Tab3: Unable to retrieve user information', err);
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
    this.workoutPlanService.getTodaysPlan().subscribe((data) => {
      this.todaysPlan = data;
      this.isLoadingToday = false;
    });
  }

  loadWeeklyPlan() {
    this.isLoadingWeek = true;
    this.workoutPlanService.getWeeklyPlan().subscribe((data) => {
      this.weeklyPlan = data;
      const daysMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayStr = daysMap[new Date().getDay()]; 
      const foundIndex = data.findIndex(d => d.day === todayStr);
      if (foundIndex !== -1) {
        this.selectedDayIndex = foundIndex;
      } else {
        this.selectedDayIndex = 0;
      }
      this.isLoadingWeek = false;
    });
  }

  selectDay(index: number) {
    this.selectedDayIndex = index;
  }

  async openWorkoutDetails(exercise: Exercise | null) {
    if (!exercise) return;
    const modal = await this.modalCtrl.create({
      component: WorkoutDetailComponent,
      componentProps: { exercise: exercise },
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