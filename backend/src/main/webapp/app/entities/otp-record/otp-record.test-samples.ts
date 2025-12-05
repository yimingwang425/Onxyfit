import dayjs from 'dayjs/esm';

import { IOtpRecord, NewOtpRecord } from './otp-record.model';

export const sampleWithRequiredData: IOtpRecord = {
  id: 1128,
  email: 'Angel_Nikolaus@hotmail.com',
  otpCode: 'circle fooey',
  expiryTime: dayjs('2025-11-27T23:46'),
};

export const sampleWithPartialData: IOtpRecord = {
  id: 3518,
  email: 'Carmine.Wilkinson80@gmail.com',
  otpCode: 'even remark',
  expiryTime: dayjs('2025-11-28T10:55'),
  verified: true,
};

export const sampleWithFullData: IOtpRecord = {
  id: 26142,
  email: 'Roberto61@gmail.com',
  otpCode: 'veg annex for',
  expiryTime: dayjs('2025-11-28T12:49'),
  verified: false,
};

export const sampleWithNewData: NewOtpRecord = {
  email: 'Wilmer23@hotmail.com',
  otpCode: 'order flight like',
  expiryTime: dayjs('2025-11-28T11:39'),
  id: null,
};

Object.freeze(sampleWithNewData);
Object.freeze(sampleWithRequiredData);
Object.freeze(sampleWithPartialData);
Object.freeze(sampleWithFullData);
