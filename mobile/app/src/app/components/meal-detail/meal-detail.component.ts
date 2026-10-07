import { ALLERGY_DISCLAIMER } from '../../services/dietary';
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  ModalController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonListHeader,
  IonLabel,
  IonItem,
  IonText,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline, openOutline, chatbubbleEllipsesOutline } from 'ionicons/icons';
import { Meal } from '../../services/meal-plan';

@Component({
  selector: 'app-meal-detail',
  templateUrl: './meal-detail.component.html',
  styleUrls: ['./meal-detail.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonListHeader,
    IonLabel,
    IonItem,
    IonText,
  ],
})
export class MealDetailComponent implements OnInit {
  allergyDisclaimer = ALLERGY_DISCLAIMER;

  @Input() meal!: Meal;
  /** Which meal of the plan this is ("breakfast", ...), and on which day (0 = Sunday), when known. */
  @Input() slot?: string;
  @Input() day?: number;

  constructor(private modalCtrl: ModalController, private router: Router) {
    addIcons({ closeCircleOutline, openOutline, chatbubbleEllipsesOutline });
  }

  /** A real meal of the plan can be changed; a placeholder for a missing one cannot. */
  get canAskToChange(): boolean {
    return !!this.slot && this.day !== undefined && this.day >= 0 && (this.meal?.ingredients?.length ?? 0) > 0;
  }

  /** Open the assistant on this meal, so the user only has to say what they want instead. */
  async askToChange() {
    await this.modalCtrl.dismiss();
    this.router.navigate(['/assistant'], { queryParams: { day: this.day, slot: this.slot, name: this.meal.name } });
  }

  ngOnInit() {}

  dismiss() {
    this.modalCtrl.dismiss();
  }

  openLink() {
    if (this.meal.amazonLink) {
      window.open(this.meal.amazonLink, '_blank');
    }
  }
}