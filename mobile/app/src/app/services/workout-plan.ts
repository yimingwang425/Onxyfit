import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { delay, map } from 'rxjs/operators';
import { PlanService, AIPlan } from './plan.service';

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  videoFile: string;
  notes: string;
  targetMuscles: string;
}

export interface DailyWorkoutPlan {
  isRestDay: boolean;
  warmUp: Exercise | null;
  exercises: Exercise[];
  coolDown: Exercise | null;
  aiData?: AIPlan;
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
  private useMock = false;

  private warmUps = {
    general: {
      name: 'Jumping Jacks',
      sets: 1,
      reps: '60s',
      videoFile: 'jumping-jacks.mp4',
      notes: 'Keep your core engaged and land lightly.',
      targetMuscles: 'Entire body',
    },
    upper: {
      name: 'Incline Push-up',
      sets: 1,
      reps: '15 reps',
      videoFile: 'incline-push-up.mp4',
      notes: 'Use a bench or elevated surface; great for warming up chest and shoulders.',
      targetMuscles: 'Chest, Shoulders, core',
    },
    lower: {
      name: 'Bodyweight Squats',
      sets: 1,
      reps: '15 reps',
      videoFile: 'bodyweight-squats.mp4',
      notes: 'Warm up the hips, knees and ankles before heavy leg work.',
      targetMuscles: 'Quads, glutes, hip flexors',
    },
  };

  private coolDowns = {
    chest: {
      name: 'Chest & Shoulder Stretch',
      sets: 1,
      reps: '30s each side',
      videoFile: 'chest-shoulder-stretch.mp4',
      notes: 'Hold each side gently; do not bounce.',
      targetMuscles: 'Chest, front deltoids',
    },
    back: {
      name: 'Lat & Upper Back Stretch',
      sets: 1,
      reps: '30s each side',
      videoFile: 'lat-upper-back-stretch.mp4',
      notes: 'Reach overhead and lean to one side; feel the stretch along your lats.',
      targetMuscles: 'Lats, upper back',
    },
    legs: {
      name: 'Quad & Hamstring Stretch',
      sets: 1,
      reps: '30s each leg',
      videoFile: 'quad-hamstring-stretch.mp4',
      notes: 'Hold each stretch gently; keep breathing throughout.',
      targetMuscles: 'Quads, hamstrings, hip flexors',
    },
    fullBody: {
      name: 'Full Body Cool-Down Stretch',
      sets: 1,
      reps: '90s',
      videoFile: 'full-body-stretch.mp4',
      notes: 'Stretch chest, back, quads and hamstrings — 30 seconds each.',
      targetMuscles: 'Full body',
    },
  };

  private exercises = {
    benchPress: {
      name: 'Bench Press',
      sets: 4,
      reps: '8-10',
      videoFile: 'bench-press.mp4',
      notes: 'Control the weight on the way down, explosive push up.',
      targetMuscles: 'Chest, triceps, shoulders',
    },
    pushUps: {
      name: 'Push-ups',
      sets: 3,
      reps: '10-12',
      videoFile: 'push-ups.mp4',
      notes: 'Keep your elbows close to your body and your back straight.',
      targetMuscles: 'Chest, triceps, shoulders',
    },
    overheadPress: {
      name: 'Overhead Press',
      sets: 3,
      reps: '8-10',
      videoFile: 'overhead-press.mp4',
      notes: 'Brace your core; press the bar straight overhead without arching your back.',
      targetMuscles: 'Shoulders, triceps',
    },
    tricepDips: {
      name: 'Tricep Dips',
      sets: 3,
      reps: '10-12',
      videoFile: 'tricep-dips.mp4',
      notes: 'Keep elbows tucked; lower until upper arms are parallel to the floor.',
      targetMuscles: 'Triceps, chest, shoulders',
    },
    pullUps: {
      name: 'Pull-ups',
      sets: 3,
      reps: '6-8',
      videoFile: 'pull-ups.mp4',
      notes: 'Pull your chest to the bar, control the descent.',
      targetMuscles: 'Back, biceps',
    },
    barbellRow: {
      name: 'Barbell Row',
      sets: 4,
      reps: '8-10',
      videoFile: 'barbell-row.mp4',
      notes: 'Hinge at the hips; pull the bar to your lower chest.',
      targetMuscles: 'Upper back, lats, biceps',
    },
    dumbbellCurl: {
      name: 'Dumbbell Bicep Curl',
      sets: 3,
      reps: '10-12',
      videoFile: 'dumbbell-curl.mp4',
      notes: 'Control the movement; no swinging.',
      targetMuscles: 'Biceps',
    },
    squats: {
      name: 'Squat',
      sets: 4,
      reps: '8-10',
      videoFile: 'squats.mp4',
      notes: 'Do not let your knees extend beyond your toes; sit back through your hips.',
      targetMuscles: 'Quads, glutes',
    },
    deadlift: {
      name: 'Deadlift',
      sets: 3,
      reps: '5-6',
      videoFile: 'deadlift.mp4',
      notes: 'Keep your back straight, push through your heels.',
      targetMuscles: 'Hamstrings, glutes, back',
    },
    lunges: {
      name: 'Walking Lunges',
      sets: 3,
      reps: '12 each leg',
      videoFile: 'lunges.mp4',
      notes: 'Keep your torso upright; step far enough that both knees reach 90 degrees.',
      targetMuscles: 'Quads, glutes, hamstrings',
    },
    calfRaises: {
      name: 'Calf Raises',
      sets: 3,
      reps: '15-20',
      videoFile: 'calf-raises.mp4',
      notes: 'Pause at the top for a full contraction.',
      targetMuscles: 'Calves',
    },
  };

  private getRoutine(sessionType: string, intensityMultiplier: number): {
    exercises: Exercise[];
    warmUp: Exercise;
    coolDown: Exercise;
  } {
    let exercises: Exercise[] = [];
    let warmUp: Exercise = this.warmUps.general;
    let coolDown: Exercise = this.coolDowns.fullBody;

    switch (sessionType) {
      case 'Push':
        exercises = [this.exercises.benchPress, this.exercises.overheadPress, this.exercises.pushUps, this.exercises.tricepDips];
        warmUp = this.warmUps.upper;
        coolDown = this.coolDowns.chest;
        break;
      case 'Pull':
        exercises = [this.exercises.barbellRow, this.exercises.pullUps, this.exercises.dumbbellCurl];
        warmUp = this.warmUps.upper;
        coolDown = this.coolDowns.back;
        break;
      case 'Legs':
        exercises = [this.exercises.squats, this.exercises.deadlift, this.exercises.lunges, this.exercises.calfRaises];
        warmUp = this.warmUps.lower;
        coolDown = this.coolDowns.legs;
        break;
      case 'Upper':
        exercises = [this.exercises.benchPress, this.exercises.barbellRow, this.exercises.overheadPress, this.exercises.pullUps];
        warmUp = this.warmUps.upper;
        coolDown = this.coolDowns.chest;
        break;
      case 'Lower':
        exercises = [this.exercises.squats, this.exercises.deadlift, this.exercises.lunges, this.exercises.calfRaises];
        warmUp = this.warmUps.lower;
        coolDown = this.coolDowns.legs;
        break;
      case 'FullBody':
        exercises = [this.exercises.squats, this.exercises.benchPress, this.exercises.barbellRow, this.exercises.overheadPress];
        warmUp = this.warmUps.general;
        coolDown = this.coolDowns.fullBody;
        break;
    }

    exercises = exercises.map(ex => ({
      ...ex,
      sets: ex.sets + Math.round(intensityMultiplier * 2),
    }));

    return { exercises, warmUp, coolDown };
  }

  private schedules: Record<string, { title: string; session: string }[]> = {
    PPL: [
      { title: 'Rest', session: 'Rest' },
      { title: 'Push Day', session: 'Push' },
      { title: 'Pull Day', session: 'Pull' },
      { title: 'Leg Day', session: 'Legs' },
      { title: 'Push Day', session: 'Push' },
      { title: 'Pull Day', session: 'Pull' },
      { title: 'Rest', session: 'Rest' },
    ],
    UPPER_LOWER: [
      { title: 'Rest', session: 'Rest' },
      { title: 'Upper Body', session: 'Upper' },
      { title: 'Lower Body', session: 'Lower' },
      { title: 'Upper Body', session: 'Upper' },
      { title: 'Lower Body', session: 'Lower' },
      { title: 'Rest', session: 'Rest' },
      { title: 'Rest', session: 'Rest' },
    ],
    FBW: [
      { title: 'Rest', session: 'Rest' },
      { title: 'Full Body', session: 'FullBody' },
      { title: 'Rest', session: 'Rest' },
      { title: 'Full Body', session: 'FullBody' },
      { title: 'Rest', session: 'Rest' },
      { title: 'Full Body', session: 'FullBody' },
      { title: 'Rest', session: 'Rest' },
    ],
  };

  constructor(private planService: PlanService) {}

  getTodaysPlan(): Observable<DailyWorkoutPlan> {
    if (this.useMock) {
      return of({
        isRestDay: false,
        warmUp: this.warmUps.general,
        exercises: [this.exercises.pushUps, this.exercises.squats],
        coolDown: this.coolDowns.fullBody,
      } as DailyWorkoutPlan).pipe(delay(300));
    } else {
      const aiPlan = this.planService.getCurrentPlan();
      if (aiPlan) {
        return of(this.buildPlanFromAI(aiPlan, new Date().getDay())).pipe(delay(100));
      } else {
        return this.planService.generatePlan().pipe(
          map(aiPlan => this.buildPlanFromAI(aiPlan, new Date().getDay()))
        );
      }
    }
  }

  getWeeklyPlan(): Observable<WeeklyWorkoutPlan[]> {
    if (this.useMock) {
      return of([
        { day: 'Wed' as const, dayShort: 'Wed', planTitle: 'Chest & Triceps', plan: { isRestDay: false, warmUp: this.warmUps.upper, exercises: [this.exercises.benchPress, this.exercises.pushUps], coolDown: this.coolDowns.chest } },
        { day: 'Thu' as const, dayShort: 'Thu', planTitle: 'Back & Biceps', plan: { isRestDay: false, warmUp: this.warmUps.upper, exercises: [this.exercises.barbellRow, this.exercises.pullUps], coolDown: this.coolDowns.back } },
        { day: 'Fri' as const, dayShort: 'Fri', planTitle: 'Day off', plan: { isRestDay: true, warmUp: null, exercises: [], coolDown: null } },
        { day: 'Sat' as const, dayShort: 'Sat', planTitle: 'Legs', plan: { isRestDay: false, warmUp: this.warmUps.lower, exercises: [this.exercises.squats, this.exercises.deadlift], coolDown: this.coolDowns.legs } },
        { day: 'Sun' as const, dayShort: 'Sun', planTitle: 'Day off', plan: { isRestDay: true, warmUp: null, exercises: [], coolDown: null } },
      ]).pipe(delay(500));
    } else {
      const aiPlan = this.planService.getCurrentPlan();
      if (aiPlan) {
        return of(this.buildWeeklyPlanFromAI(aiPlan)).pipe(delay(100));
      } else {
        return this.planService.generatePlan().pipe(map(aiPlan => this.buildWeeklyPlanFromAI(aiPlan)));
      }
    }
  }

  private buildPlanFromAI(aiPlan: AIPlan, dayOfWeek: number): DailyWorkoutPlan {
    const wt = aiPlan.workoutType ?? 'FBW';
    const schedule = this.schedules[wt] ?? this.schedules['FBW'];
    const dayInfo = schedule[dayOfWeek];

    if (dayInfo.session === 'Rest') {
      return { isRestDay: true, warmUp: null, exercises: [], coolDown: null, aiData: aiPlan };
    }

    const routine = this.getRoutine(dayInfo.session, aiPlan.workoutIntensity ?? 0.5);
    return { isRestDay: false, warmUp: routine.warmUp, exercises: routine.exercises, coolDown: routine.coolDown, aiData: aiPlan };
  }

  private buildWeeklyPlanFromAI(aiPlan: AIPlan): WeeklyWorkoutPlan[] {
    const today = new Date().getDay();
    const dayLabels: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[] =
      ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const wt = aiPlan.workoutType ?? 'FBW';
    const schedule = this.schedules[wt] ?? this.schedules['FBW'];
    const week: WeeklyWorkoutPlan[] = [];

    const remaining = today === 0 ? 1 : 8 - today;
    for (let offset = 0; offset < remaining; offset++) {
      const i = (today + offset) % 7;
      week.push({ day: dayLabels[i], dayShort: dayLabels[i], planTitle: schedule[i].title, plan: this.buildPlanFromAI(aiPlan, i) });
    }
    return week;
  }
}