import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { delay } from 'rxjs/operators';

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  gifUrl: string;
  notes: string;
  targetMuscles: string;
}

export interface DailyWorkoutPlan {
  isRestDay: boolean;
  warmUp: Exercise | null;
  exercises: Exercise[];
  coolDown: Exercise | null;
}

export interface WeeklyWorkoutPlan {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  dayShort: string;
  planTitle: string;
  plan: DailyWorkoutPlan;
}

@Injectable({
  providedIn: 'root',
})
export class WorkoutPlanService {
  private mockExercises = {
    jumpingJacks: {
      name: 'Jumping jacks',
      sets: 1,
      reps: '60s',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYTJib2NmMjhpZGR3eGZ5dGZ2OXBvMnBzaGticG5meWpjZ2Q0bXYzZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/2WdHa8e6m1S5G/giphy.gif',
      notes: 'Keep your core engaged and land lightly.',
      targetMuscles: 'entire body',
    },

    pushUps: {
      name: 'Push-ups',
      sets: 3,
      reps: '10-12',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExdXRvOXA3bWdzenZ0ajg0cW5nM2ZpZ3l0cjZzcHd1dXQ2NXJ2cGFjYSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/I3EsiwtybAcA2E8s0L/giphy.gif',
      notes: 'Keep your elbows close to your body and your back straight.',
      targetMuscles: 'Chest, triceps, shoulders',
    },
    squats: {
      name: 'Squat',
      sets: 3,
      reps: '10-12',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExeXE0NWhtMm5zamt4b2RlbDNxMnhtNHNpbXB0N2VpcGh6eDVrNXBjbiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/u2RokWpQfDABa/giphy.gif',
      notes: 'Do not let your knees extend beyond your toes; sit back through your hips.',
      targetMuscles: 'Quadriceps femoris, gluteus maximus',
    },

    chestStretch: {
      name: 'Chest Stretch',
      sets: 1,
      reps: '30s',
      gifUrl: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExd2R4d3RpdzNvd2YwZGZidGo2cjZtbGlmNmFkYWZkM3B0b2N3eWlpZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o6Zt2fX3y0a4wW3GU/giphy.gif',
      notes: 'Feel the stretch in your pectoralis major muscles, and avoid shrugging your shoulders.',
      targetMuscles: 'chest',
    },
  };

  constructor() {}

  getTodaysPlan(): Observable<DailyWorkoutPlan> {
    const today: DailyWorkoutPlan = {
      isRestDay: false,
      warmUp: this.mockExercises.jumpingJacks,
      exercises: [this.mockExercises.pushUps, this.mockExercises.squats],
      coolDown: this.mockExercises.chestStretch,
    };
    return of(today).pipe(delay(300));
  }

  // Obtain this week's schedule (mock)
  //Simulate users registering on Wednesday
  getWeeklyPlan(): Observable<WeeklyWorkoutPlan[]> {
    const week: WeeklyWorkoutPlan[] = [
      // { day: 'Mon', dayShort: 'Mon', ... },
      // { day: 'Tue', dayShort: 'Tue', ... },
      {
        day: 'Wed',
        dayShort: 'Wed',
        planTitle: 'Chest & Triceps',
        plan: {
          isRestDay: false,
          warmUp: this.mockExercises.jumpingJacks,
          exercises: [this.mockExercises.pushUps],
          coolDown: this.mockExercises.chestStretch,
        },
      },
      {
        day: 'Thu',
        dayShort: 'Thu',
        planTitle: 'Back & Biceps',
        plan: {
          isRestDay: false,
          warmUp: this.mockExercises.jumpingJacks,
          exercises: [this.mockExercises.squats],
          coolDown: this.mockExercises.chestStretch,
        },
      },
      {
        day: 'Fri',
        dayShort: 'Fri',
        planTitle: 'Day off',
        plan: {
          isRestDay: true,
          warmUp: null,
          exercises: [],
          coolDown: null,
        },
      },
      {
        day: 'Sat',
        dayShort: 'Sat',
        planTitle: 'Legs & Shoulders',
        plan: {
          isRestDay: false,
          warmUp: this.mockExercises.jumpingJacks,
          exercises: [this.mockExercises.squats, this.mockExercises.pushUps],
          coolDown: this.mockExercises.chestStretch,
        },
      },
      {
        day: 'Sun',
        dayShort: 'Sun',
        planTitle: 'Day off',
        plan: {
          isRestDay: true,
          warmUp: null,
          exercises: [],
          coolDown: null,
        },
      },
    ];

    return of(week).pipe(delay(500));
  }
}