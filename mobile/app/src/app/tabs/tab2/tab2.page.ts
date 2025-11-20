import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileCheckModalComponent } from '../../components/profile-check-modal/profile-check-modal.component';
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
  AlertController,
  NavController
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
import { UserProfileService } from '../../services/user-profile';

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
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private profileService: UserProfileService
  ) {
    addIcons({ restaurantOutline });
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.checkProfileAndLoad();
  }

  async checkProfileAndLoad() {
    const missingFields = this.profileService.getMissingFields();
    
    // 场景 1: 缺信息 (Profile Incomplete)
    if (missingFields.length > 0) {
      const modal = await this.modalCtrl.create({
        component: ProfileCheckModalComponent,
        componentProps: {
          mode: 'missing',
          missingFields: missingFields
        },
        backdropDismiss: false, // 强制用户操作
        // 可以设置成全屏或者是这种居中的 Card 样式，这里我们用默认的全屏 Modal 体验更好
      });

      await modal.present();
      const { role } = await modal.onWillDismiss();

      if (role === 'complete') {
        this.navCtrl.navigateForward('/auth/user-profile-setup?from=missing');
      }
      return; // 阻止加载数据
    }

    // 场景 2: 首次确认 (Confirm Profile)
    const hasConfirmed = localStorage.getItem('has_confirmed_plan_start');

    if (!hasConfirmed) {
      const summary = this.profileService.getSummaryString();
      
      const modal = await this.modalCtrl.create({
        component: ProfileCheckModalComponent,
        componentProps: {
          mode: 'confirm',
          summary: summary
        },
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
    this.mealPlanService.getTodaysPlan().subscribe((data) => {
      this.todaysPlan = data;
      this.isLoadingToday = false;
    });
  }

  loadWeeklyPlan() {
    this.isLoadingWeek = true;
    this.mealPlanService.getWeeklyPlan().subscribe((data) => {
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