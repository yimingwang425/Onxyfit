import dayjs from 'dayjs/esm';
import { IUserProfile } from 'app/entities/user-profile/user-profile.model';
import { IPlan } from 'app/entities/plan/plan.model';

export interface IProgressLog {
  id: number;
  logDate?: dayjs.Dayjs | null;
  weightKg?: number | null;
  completedWorkout?: boolean | null;
  caloriesIntake?: number | null;
  steps?: number | null;
  notes?: string | null;
  createdAt?: dayjs.Dayjs | null;
  profile?: Pick<IUserProfile, 'id'> | null;
  plan?: Pick<IPlan, 'id'> | null;
}

export type NewProgressLog = Omit<IProgressLog, 'id'> & { id: null };
