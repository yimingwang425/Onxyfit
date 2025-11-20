import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButton, 
  IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { fitnessOutline, barbellOutline } from 'ionicons/icons';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [
    IonIcon,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButton, 
    CommonModule, 
    RouterModule
  ]
})
export class WelcomePage {
  constructor() {
    addIcons({ fitnessOutline, barbellOutline });
  }
}