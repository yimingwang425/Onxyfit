import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { closeCircleOutline, openOutline } from 'ionicons/icons';
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
  @Input() meal!: Meal;

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeCircleOutline, openOutline });
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