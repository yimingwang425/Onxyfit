import { Injectable } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import dayjs from 'dayjs/esm';
import { DATE_TIME_FORMAT } from 'app/config/input.constants';
import { IUserProfile, NewUserProfile } from '../user-profile.model';

/**
 * A partial Type with required key is used as form input.
 */
type PartialWithRequiredKeyOf<T extends { id: unknown }> = Partial<Omit<T, 'id'>> & { id: T['id'] };

/**
 * Type for createFormGroup and resetForm argument.
 * It accepts IUserProfile for edit and NewUserProfileFormGroupInput for create.
 */
type UserProfileFormGroupInput = IUserProfile | PartialWithRequiredKeyOf<NewUserProfile>;

/**
 * Type that converts some properties for forms.
 */
type FormValueOf<T extends IUserProfile | NewUserProfile> = Omit<T, 'createdAt'> & {
  createdAt?: string | null;
};

type UserProfileFormRawValue = FormValueOf<IUserProfile>;

type NewUserProfileFormRawValue = FormValueOf<NewUserProfile>;

type UserProfileFormDefaults = Pick<NewUserProfile, 'id' | 'createdAt'>;

type UserProfileFormGroupContent = {
  id: FormControl<UserProfileFormRawValue['id'] | NewUserProfile['id']>;
  age: FormControl<UserProfileFormRawValue['age']>;
  heightCm: FormControl<UserProfileFormRawValue['heightCm']>;
  weightKg: FormControl<UserProfileFormRawValue['weightKg']>;
  activityLevel: FormControl<UserProfileFormRawValue['activityLevel']>;
  goal: FormControl<UserProfileFormRawValue['goal']>;
  dietPref: FormControl<UserProfileFormRawValue['dietPref']>;
  metabolicProfile: FormControl<UserProfileFormRawValue['metabolicProfile']>;
  createdAt: FormControl<UserProfileFormRawValue['createdAt']>;
  user: FormControl<UserProfileFormRawValue['user']>;
};

export type UserProfileFormGroup = FormGroup<UserProfileFormGroupContent>;

@Injectable({ providedIn: 'root' })
export class UserProfileFormService {
  createUserProfileFormGroup(userProfile: UserProfileFormGroupInput = { id: null }): UserProfileFormGroup {
    const userProfileRawValue = this.convertUserProfileToUserProfileRawValue({
      ...this.getFormDefaults(),
      ...userProfile,
    });
    return new FormGroup<UserProfileFormGroupContent>({
      id: new FormControl(
        { value: userProfileRawValue.id, disabled: true },
        {
          nonNullable: true,
          validators: [Validators.required],
        },
      ),
      age: new FormControl(userProfileRawValue.age, {
        validators: [Validators.required, Validators.min(10), Validators.max(100)],
      }),
      heightCm: new FormControl(userProfileRawValue.heightCm, {
        validators: [Validators.required, Validators.min(80), Validators.max(380)],
      }),
      weightKg: new FormControl(userProfileRawValue.weightKg, {
        validators: [Validators.required],
      }),
      activityLevel: new FormControl(userProfileRawValue.activityLevel, {
        validators: [Validators.required],
      }),
      goal: new FormControl(userProfileRawValue.goal, {
        validators: [Validators.required],
      }),
      dietPref: new FormControl(userProfileRawValue.dietPref, {
        validators: [Validators.required],
      }),
      metabolicProfile: new FormControl(userProfileRawValue.metabolicProfile, {
        validators: [Validators.required],
      }),
      createdAt: new FormControl(userProfileRawValue.createdAt, {
        validators: [Validators.required],
      }),
      user: new FormControl(userProfileRawValue.user, {
        validators: [Validators.required],
      }),
    });
  }

  getUserProfile(form: UserProfileFormGroup): IUserProfile | NewUserProfile {
    return this.convertUserProfileRawValueToUserProfile(form.getRawValue() as UserProfileFormRawValue | NewUserProfileFormRawValue);
  }

  resetForm(form: UserProfileFormGroup, userProfile: UserProfileFormGroupInput): void {
    const userProfileRawValue = this.convertUserProfileToUserProfileRawValue({ ...this.getFormDefaults(), ...userProfile });
    form.reset(
      {
        ...userProfileRawValue,
        id: { value: userProfileRawValue.id, disabled: true },
      } as any /* cast to workaround https://github.com/angular/angular/issues/46458 */,
    );
  }

  private getFormDefaults(): UserProfileFormDefaults {
    const currentTime = dayjs();

    return {
      id: null,
      createdAt: currentTime,
    };
  }

  private convertUserProfileRawValueToUserProfile(
    rawUserProfile: UserProfileFormRawValue | NewUserProfileFormRawValue,
  ): IUserProfile | NewUserProfile {
    return {
      ...rawUserProfile,
      createdAt: dayjs(rawUserProfile.createdAt, DATE_TIME_FORMAT),
    };
  }

  private convertUserProfileToUserProfileRawValue(
    userProfile: IUserProfile | (Partial<NewUserProfile> & UserProfileFormDefaults),
  ): UserProfileFormRawValue | PartialWithRequiredKeyOf<NewUserProfileFormRawValue> {
    return {
      ...userProfile,
      createdAt: userProfile.createdAt ? userProfile.createdAt.format(DATE_TIME_FORMAT) : undefined,
    };
  }
}
