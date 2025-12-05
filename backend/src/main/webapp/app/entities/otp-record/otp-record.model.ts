import dayjs from 'dayjs/esm';

export interface IOtpRecord {
  id: number;
  email?: string | null;
  otpCode?: string | null;
  expiryTime?: dayjs.Dayjs | null;
  verified?: boolean | null;
}

export type NewOtpRecord = Omit<IOtpRecord, 'id'> & { id: null };
