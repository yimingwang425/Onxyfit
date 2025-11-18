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
  IonLabel,
  IonItem,
  IonText,
  IonList,
  IonListHeader,
  IonChip,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { closeCircleOutline } from 'ionicons/icons';
import { Exercise } from '../../services/workout-plan';

@Component({
  selector: 'app-workout-detail',
  templateUrl: './workout-detail.component.html',
  styleUrls: ['./workout-detail.component.scss'],
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
    IonLabel,
    IonItem,
    IonText,
    IonList,
    IonListHeader,
    IonChip,
  ],
})
export class WorkoutDetailComponent implements OnInit {
  @Input() exercise!: Exercise;

  constructor(private modalCtrl: ModalController) {
    addIcons({ closeCircleOutline });
  }

  ngOnInit() {}

  dismiss() {
    this.modalCtrl.dismiss();
  }
}