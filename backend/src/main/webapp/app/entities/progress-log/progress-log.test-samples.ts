import dayjs from 'dayjs/esm';

import { IProgressLog, NewProgressLog } from './progress-log.model';

export const sampleWithRequiredData: IProgressLog = {
  id: 14243,
  logDate: dayjs('2025-11-29'),
  completedWorkout: false,
  createdAt: dayjs('2025-11-29T01:11'),
};

export const sampleWithPartialData: IProgressLog = {
  id: 7716,
  logDate: dayjs('2025-11-29'),
  weightKg: 13599.05,
  completedWorkout: false,
  caloriesIntake: 2608,
  steps: 177968,
  notes: 'gee switchboard ouch',
  createdAt: dayjs('2025-11-29T10:54'),
};

export const sampleWithFullData: IProgressLog = {
  id: 8864,
  logDate: dayjs('2025-11-29'),
  weightKg: 13909.5,
  completedWorkout: true,
  caloriesIntake: 4754,
  steps: 203693,
  notes: 'sardonic gum',
  createdAt: dayjs('2025-11-28T19:44'),
};

export const sampleWithNewData: NewProgressLog = {
  logDate: dayjs('2025-11-29'),
  completedWorkout: false,
  createdAt: dayjs('2025-11-28T20:15'),
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
