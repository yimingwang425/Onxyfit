import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IOtpRecord, NewOtpRecord } from '../otp-record.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IOtpRecord for edit and NewOtpRecordFormGroupInput for create.
 */
type OtpRecordFormGroupInput = IOtpRecord | PartialWithRequiredKeyOf<NewOtpRecord>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IOtpRecord | NewOtpRecord> = Omit<T, 'expiryTime'> & {
  expiryTime?: string | null;
};

type OtpRecordFormRawValue = FormValueOf<IOtpRecord>;

type NewOtpRecordFormRawValue = FormValueOf<NewOtpRecord>;

type OtpRecordFormDefaults = Pick<NewOtpRecord, 'id' | 'expiryTime' | 'verified'>;

type OtpRecordFormGroupContent = {
  id: FormControl<OtpRecordFormRawValue['id'] | NewOtpRecord['id']>;
  email: FormControl<OtpRecordFormRawValue['email']>;
  otpCode: FormControl<OtpRecordFormRawValue['otpCode']>;
  expiryTime: FormControl<OtpRecordFormRawValue['expiryTime']>;
  verified: FormControl<OtpRecordFormRawValue['verified']>;
};

export type OtpRecordFormGroup = FormGroup<OtpRecordFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class OtpRecordFormService {
  createOtpRecordFormGroup(otpRecord: OtpRecordFormGroupInput = { id: null }): OtpRecordFormGroup {
    const otpRecordRawValue = this.convertOtpRecordToOtpRecordRawValue({
      ...this.getFormDefaults(),
      ...otpRecord,
    });
    return new FormGroup<OtpRecordFormGroupContent>({
      id: new FormControl(
        { value: otpRecordRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      email: new FormControl(otpRecordRawValue.email, {
        validators: [Validators.required],
      }),
      otpCode: new FormControl(otpRecordRawValue.otpCode, {
        validators: [Validators.required],
      }),
      expiryTime: new FormControl(otpRecordRawValue.expiryTime, {
        validators: [Validators.required],
      }),
      verified: new FormControl(otpRecordRawValue.verified),
    });
  }

  getOtpRecord(form: OtpRecordFormGroup): IOtpRecord | NewOtpRecord {
    return this.convertOtpRecordRawValueToOtpRecord(form.getRawValue() as OtpRecordFormRawValue | NewOtpRecordFormRawValue);
  }

  resetForm(form: OtpRecordFormGroup, otpRecord: OtpRecordFormGroupInput): void {
    const otpRecordRawValue = this.convertOtpRecordToOtpRecordRawValue({ ...this.getFormDefaults(), ...otpRecord });
    form.reset(
      {
        ...otpRecordRawValue,
        id: { value: otpRecordRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): OtpRecordFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      expiryTime: currentTime,
      verified: false,
    };
  }

  private convertOtpRecordRawValueToOtpRecord(rawOtpRecord: OtpRecordFormRawValue | NewOtpRecordFormRawValue): IOtpRecord | NewOtpRecord {
    return {
      ...rawOtpRecord,
      expiryTime: dayjs(rawOtpRecord.expiryTime, DATE_TIME_FORMAT),
    };
  }

  private convertOtpRecordToOtpRecordRawValue(
    otpRecord: IOtpRecord | (Partial<NewOtpRecord> & OtpRecordFormDefaults),
  ): OtpRecordFormRawValue | PartialWithRequiredKeyOf<NewOtpRecordFormRawValue> {
    return {
      ...otpRecord,
      expiryTime: otpRecord.expiryTime ? otpRecord.expiryTime.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
