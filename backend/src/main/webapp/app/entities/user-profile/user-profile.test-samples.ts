import dayjs from 'dayjs/esm';

import { IUserProfile, NewUserProfile } from './user-profile.model';

export const sampleWithRequiredData: IUserProfile = {
  id: 4033,
  age: 94,
  heightCm: 202.37,
  weightKg: 5349.97,
  activityLevel: 'ACTIVE',
  goal: 'MAINTAIN',
  dietPref: 'BALANCED',
  metabolicProfile: 'PROFILE_2',
  createdAt: dayjs('2025-11-29T00:38'),
};

export const sampleWithPartialData: IUserProfile = {
  id: 2358,
  age: 37,
  heightCm: 136.06,
  weightKg: 31139.55,
  activityLevel: 'MODERATE',
  goal: 'MAINTAIN',
  dietPref: 'VEGETARIAN',
  metabolicProfile: 'PROFILE_2',
  createdAt: dayjs('2025-11-29T05:22'),
};

export const sampleWithFullData: IUserProfile = {
  id: 9570,
  age: 78,
  heightCm: 347.8,
  weightKg: 11736.64,
  activityLevel: 'LIGHT',
  goal: 'LOSE',
  dietPref: 'NO_PREFERENCE',
  metabolicProfile: 'PROFILE_1',
  createdAt: dayjs('2025-11-29T03:20'),
};

export const sampleWithNewData: NewUserProfile = {
  age: 74,
  heightCm: 342.43,
  weightKg: 28890.88,
  activityLevel: 'MODERATE',
  goal: 'MAINTAIN',
  dietPref: 'VEGETARIAN',
  metabolicProfile: 'PROFILE_1',
  createdAt: dayjs('2025-11-29T17:52'),
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
