import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonContent, IonButton, IonIcon, IonText } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, checkmarkCircleOutline, createOutline } from 'ionicons/icons';

@Component({
  selector: 'app-profile-check-modal',
  templateUrl: './profile-check-modal.component.html',
  styleUrls: ['./profile-check-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon, IonText]
})
export class ProfileCheckModalComponent implements OnInit {
  @Input() mode: 'missing' | 'confirm' = 'missing';
  
  @Input() missingFields: string[] = [];
  
  @Input() summary: string = '';

  constructor(private modalCtrl: ModalController) {
    addIcons({ alertCircleOutline, checkmarkCircleOutline, createOutline });
  }

  ngOnInit() {}

  action(role: string) {
    this.modalCtrl.dismiss(null, role);
  }
}