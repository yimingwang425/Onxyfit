import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent, 
  IonList, IonItem, IonLabel, IonToggle, IonIcon, IonDatetime, IonModal
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  waterOutline, happyOutline, barbellOutline, 
  sunnyOutline, restaurantOutline, moonOutline, timeOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.page.html',
  styleUrls: ['./notification.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    IonHeader, IonToolbar, IonButtons, IonBackButton, IonTitle, IonContent,
    IonList, IonItem, IonLabel, IonToggle, IonIcon, IonDatetime, IonModal
  ]
})
export class NotificationPage implements OnInit {
  
  config = {
    water: true,
    mood: true,
    workout: {
      enabled: true,
      time: '2023-01-01T17:00:00'
    },
    meal: {
      breakfastEnabled: true,
      breakfastTime: '2023-01-01T08:00:00',
      lunchEnabled: true,
      lunchTime: '2023-01-01T12:00:00',
      dinnerEnabled: true,
      dinnerTime: '2023-01-01T19:00:00'
    }
  };

  constructor() {
    addIcons({ waterOutline, happyOutline, barbellOutline, sunnyOutline, restaurantOutline, moonOutline, timeOutline });
  }

  ngOnInit() {
    this.loadConfig();
  }

  loadConfig() {
    const saved = localStorage.getItem('notification_config');
    if (saved) {
      try {
        this.config = JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing notification config', e);
      }
    }
  }

  saveConfig() {
    localStorage.setItem('notification_config', JSON.stringify(this.config));
    console.log('Notification config saved:', this.config);
  }

  formatTime(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}