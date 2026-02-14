import dayjs from 'dayjs/esm';

import { IPlan, NewPlan } from './plan.model';

export const sampleWithRequiredData: IPlan = {
  id: 10097,
  caloriesKcal: 4798,
  proteinG: 244.55,
  carbsG: 31.53,
  fatG: 400.46,
  source: 'after considering',
  createdAt: dayjs('2025-11-29T09:17'),
};

export const sampleWithPartialData: IPlan = {
  id: 30458,
  caloriesKcal: 2779,
  proteinG: 13.49,
  carbsG: 823.5,
  fatG: 155.62,
  workoutType: 'PPL',
  source: 'yippee unexpectedly offensively',
  createdAt: dayjs('2025-11-29T12:02'),
  workoutPlanJson: '../fake-data/blob/hipster.txt',
  weekStartDate: dayjs('2025-11-28'),
};

export const sampleWithFullData: IPlan = {
  id: 11506,
  caloriesKcal: 2803,
  proteinG: 55.72,
  carbsG: 996.71,
  fatG: 91.34,
  workoutType: 'UPPER_LOWER',
  workoutIntensity: 0.71,
  source: 'yet whisper happy',
  createdAt: dayjs('2025-11-29T08:13'),
  mealPlanJson: '../fake-data/blob/hipster.txt',
  workoutPlanJson: '../fake-data/blob/hipster.txt',
  weekStartDate: dayjs('2025-11-29'),
};

export const sampleWithNewData: NewPlan = {
  caloriesKcal: 1745,
  proteinG: 168.43,
  carbsG: 455.17,
  fatG: 852.77,
  source: 'about reborn apropos',
  createdAt: dayjs('2025-11-29T09:19'),
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
