import dayjs from 'dayjs/esm';
import { IUser } from 'app/entities/user/user.model';
import { ActivityLevel } from 'app/entities/enumerations/activity-level.model';
import { Goal } from 'app/entities/enumerations/goal.model';
import { DietPref } from 'app/entities/enumerations/diet-pref.model';
import { MetabolicProfile } from 'app/entities/enumerations/metabolic-profile.model';

export interface IUserProfile {
  id: number;
  age?: number | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: keyof typeof ActivityLevel | null;
  goal?: keyof typeof Goal | null;
  dietPref?: keyof typeof DietPref | null;
  metabolicProfile?: keyof typeof MetabolicProfile | null;
  createdAt?: dayjs.Dayjs | null;
  user?: Pick<IUser, 'id' | 'login'> | null;
}

export type NewUserProfile = Omit<IUserProfile, 'id'> & { id: null };
