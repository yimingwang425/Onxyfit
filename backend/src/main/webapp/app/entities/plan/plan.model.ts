import dayjs from 'dayjs/esm';
import { IUserProfile } from 'app/entities/user-profile/user-profile.model';
import { WorkoutType } from 'app/entities/enumerations/workout-type.model';

export interface IPlan {
  id: number;
  caloriesKcal?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
  workoutType?: keyof typeof WorkoutType | null;
  workoutIntensity?: number | null;
  source?: string | null;
  createdAt?: dayjs.Dayjs | null;
  mealPlanJson?: string | null;
  workoutPlanJson?: string | null;
  weekStartDate?: dayjs.Dayjs | null;
  profile?: Pick<IUserProfile, 'id'> | null;
}

export type NewPlan = Omit<IPlan, 'id'> & { id: null };
