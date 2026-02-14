import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IPlan, NewPlan } from '../plan.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IPlan for edit and NewPlanFormGroupInput for create.
 */
type PlanFormGroupInput = IPlan | PartialWithRequiredKeyOf<NewPlan>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IPlan | NewPlan> = Omit<T, 'createdAt'> & {
  createdAt?: string | null;
};

type PlanFormRawValue = FormValueOf<IPlan>;

type NewPlanFormRawValue = FormValueOf<NewPlan>;

type PlanFormDefaults = Pick<NewPlan, 'id' | 'createdAt'>;

type PlanFormGroupContent = {
  id: FormControl<PlanFormRawValue['id'] | NewPlan['id']>;
  caloriesKcal: FormControl<PlanFormRawValue['caloriesKcal']>;
  proteinG: FormControl<PlanFormRawValue['proteinG']>;
  carbsG: FormControl<PlanFormRawValue['carbsG']>;
  fatG: FormControl<PlanFormRawValue['fatG']>;
  workoutType: FormControl<PlanFormRawValue['workoutType']>;
  workoutIntensity: FormControl<PlanFormRawValue['workoutIntensity']>;
  source: FormControl<PlanFormRawValue['source']>;
  createdAt: FormControl<PlanFormRawValue['createdAt']>;
  mealPlanJson: FormControl<PlanFormRawValue['mealPlanJson']>;
  workoutPlanJson: FormControl<PlanFormRawValue['workoutPlanJson']>;
  weekStartDate: FormControl<PlanFormRawValue['weekStartDate']>;
  profile: FormControl<PlanFormRawValue['profile']>;
};

export type PlanFormGroup = FormGroup<PlanFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class PlanFormService {
  createPlanFormGroup(plan: PlanFormGroupInput = { id: null }): PlanFormGroup {
    const planRawValue = this.convertPlanToPlanRawValue({
      ...this.getFormDefaults(),
      ...plan,
    });
    return new FormGroup<PlanFormGroupContent>({
      id: new FormControl(
        { value: planRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      caloriesKcal: new FormControl(planRawValue.caloriesKcal, {
        validators: [Validators.required, Validators.min(100), Validators.max(6000)],
      }),
      proteinG: new FormControl(planRawValue.proteinG, {
        validators: [Validators.required, Validators.min(0), Validators.max(500)],
      }),
      carbsG: new FormControl(planRawValue.carbsG, {
        validators: [Validators.required, Validators.min(0), Validators.max(1000)],
      }),
      fatG: new FormControl(planRawValue.fatG, {
        validators: [Validators.required, Validators.min(0), Validators.max(1000)],
      }),
      workoutType: new FormControl(planRawValue.workoutType),
      workoutIntensity: new FormControl(planRawValue.workoutIntensity, {
        validators: [Validators.min(0), Validators.max(1)],
      }),
      source: new FormControl(planRawValue.source, {
        validators: [Validators.required],
      }),
      createdAt: new FormControl(planRawValue.createdAt, {
        validators: [Validators.required],
      }),
      mealPlanJson: new FormControl(planRawValue.mealPlanJson),
      workoutPlanJson: new FormControl(planRawValue.workoutPlanJson),
      weekStartDate: new FormControl(planRawValue.weekStartDate),
      profile: new FormControl(planRawValue.profile, {
        validators: [Validators.required],
      }),
    });
  }

  getPlan(form: PlanFormGroup): IPlan | NewPlan {
    return this.convertPlanRawValueToPlan(form.getRawValue() as PlanFormRawValue | NewPlanFormRawValue);
  }

  resetForm(form: PlanFormGroup, plan: PlanFormGroupInput): void {
    const planRawValue = this.convertPlanToPlanRawValue({ ...this.getFormDefaults(), ...plan });
    form.reset(
      {
        ...planRawValue,
        id: { value: planRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): PlanFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      createdAt: currentTime,
    };
  }

  private convertPlanRawValueToPlan(rawPlan: PlanFormRawValue | NewPlanFormRawValue): IPlan | NewPlan {
    return {
      ...rawPlan,
      createdAt: dayjs(rawPlan.createdAt, DATE_TIME_FORMAT),
    };
  }

  private convertPlanToPlanRawValue(
    plan: IPlan | (Partial<NewPlan> & PlanFormDefaults),
  ): PlanFormRawValue | PartialWithRequiredKeyOf<NewPlanFormRawValue> {
    return {
      ...plan,
      createdAt: plan.createdAt ? plan.createdAt.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
