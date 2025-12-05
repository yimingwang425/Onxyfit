import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IProgressLog, NewProgressLog } from '../progress-log.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IProgressLog for edit and NewProgressLogFormGroupInput for create.
 */
type ProgressLogFormGroupInput = IProgressLog | PartialWithRequiredKeyOf<NewProgressLog>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IProgressLog | NewProgressLog> = Omit<T, 'createdAt'> & {
  createdAt?: string | null;
};

type ProgressLogFormRawValue = FormValueOf<IProgressLog>;

type NewProgressLogFormRawValue = FormValueOf<NewProgressLog>;

type ProgressLogFormDefaults = Pick<NewProgressLog, 'id' | 'completedWorkout' | 'createdAt'>;

type ProgressLogFormGroupContent = {
  id: FormControl<ProgressLogFormRawValue['id'] | NewProgressLog['id']>;
  logDate: FormControl<ProgressLogFormRawValue['logDate']>;
  weightKg: FormControl<ProgressLogFormRawValue['weightKg']>;
  completedWorkout: FormControl<ProgressLogFormRawValue['completedWorkout']>;
  caloriesIntake: FormControl<ProgressLogFormRawValue['caloriesIntake']>;
  steps: FormControl<ProgressLogFormRawValue['steps']>;
  notes: FormControl<ProgressLogFormRawValue['notes']>;
  createdAt: FormControl<ProgressLogFormRawValue['createdAt']>;
  profile: FormControl<ProgressLogFormRawValue['profile']>;
  plan: FormControl<ProgressLogFormRawValue['plan']>;
};

export type ProgressLogFormGroup = FormGroup<ProgressLogFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class ProgressLogFormService {
  createProgressLogFormGroup(progressLog: ProgressLogFormGroupInput = { id: null }): ProgressLogFormGroup {
    const progressLogRawValue = this.convertProgressLogToProgressLogRawValue({
      ...this.getFormDefaults(),
      ...progressLog,
    });
    return new FormGroup<ProgressLogFormGroupContent>({
      id: new FormControl(
        { value: progressLogRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      logDate: new FormControl(progressLogRawValue.logDate, {
        validators: [Validators.required],
      }),
      weightKg: new FormControl(progressLogRawValue.weightKg),
      completedWorkout: new FormControl(progressLogRawValue.completedWorkout, {
        validators: [Validators.required],
      }),
      caloriesIntake: new FormControl(progressLogRawValue.caloriesIntake, {
        validators: [Validators.min(0), Validators.max(15000)],
      }),
      steps: new FormControl(progressLogRawValue.steps, {
        validators: [Validators.min(0), Validators.max(250000)],
      }),
      notes: new FormControl(progressLogRawValue.notes, {
        validators: [Validators.maxLength(1000)],
      }),
      createdAt: new FormControl(progressLogRawValue.createdAt, {
        validators: [Validators.required],
      }),
      profile: new FormControl(progressLogRawValue.profile, {
        validators: [Validators.required],
      }),
      plan: new FormControl(progressLogRawValue.plan),
    });
  }

  getProgressLog(form: ProgressLogFormGroup): IProgressLog | NewProgressLog {
    return this.convertProgressLogRawValueToProgressLog(form.getRawValue() as ProgressLogFormRawValue | NewProgressLogFormRawValue);
  }

  resetForm(form: ProgressLogFormGroup, progressLog: ProgressLogFormGroupInput): void {
    const progressLogRawValue = this.convertProgressLogToProgressLogRawValue({ ...this.getFormDefaults(), ...progressLog });
    form.reset(
      {
        ...progressLogRawValue,
        id: { value: progressLogRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): ProgressLogFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      completedWorkout: false,
      createdAt: currentTime,
    };
  }

  private convertProgressLogRawValueToProgressLog(
    rawProgressLog: ProgressLogFormRawValue | NewProgressLogFormRawValue,
  ): IProgressLog | NewProgressLog {
    return {
      ...rawProgressLog,
      createdAt: dayjs(rawProgressLog.createdAt, DATE_TIME_FORMAT),
    };
  }

  private convertProgressLogToProgressLogRawValue(
    progressLog: IProgressLog | (Partial<NewProgressLog> & ProgressLogFormDefaults),
  ): ProgressLogFormRawValue | PartialWithRequiredKeyOf<NewProgressLogFormRawValue> {
    return {
      ...progressLog,
      createdAt: progressLog.createdAt ? progressLog.createdAt.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
