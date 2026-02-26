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
import { UserProfileService } from '../../services/user-profile';

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

  videoUrl = '';

  constructor(
    private modalCtrl: ModalController,
    private profileService: UserProfileService
  ) {
    addIcons({ closeCircleOutline });
  }

  ngOnInit() {
    this.loadVideoUrl();
  }

  private loadVideoUrl() {
    this.profileService.getProfileData().subscribe({
      next: (data: any) => {
        let profile = Array.isArray(data) && data.length > 0 ? data[0] : null;
        const gender = profile?.metabolicProfile === 'PROFILE_2' ? 'female' : 'male';
        this.videoUrl = `assets/workout/${gender}/${this.exercise.videoFile}`;
      },
      error: () => {
        this.videoUrl = `assets/workout/male/${this.exercise.videoFile}`;
      }
    });
  }

  dismiss() {
    this.modalCtrl.dismiss();
  }
}