import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IUserProfile } from 'app/entities/user-profile/user-profile.model';
import { UserProfileService } from 'app/entities/user-profile/service/user-profile.service';
import { IPlan } from 'app/entities/plan/plan.model';
import { PlanService } from 'app/entities/plan/service/plan.service';
import { ProgressLogService } from '../service/progress-log.service';
import { IProgressLog } from '../progress-log.model';
import { ProgressLogFormGroup, ProgressLogFormService } from './progress-log-form.service';

@Component({
  standalone: true,
  selector: 'jhi-progress-log-update',
  templateUrl: './progress-log-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class ProgressLogUpdateComponent implements OnInit {
  isSaving = false;
  progressLog: IProgressLog | null = null;

  userProfilesSharedCollection: IUserProfile[] = [];
  plansSharedCollection: IPlan[] = [];

  protected progressLogService = inject(ProgressLogService);
  protected progressLogFormService = inject(ProgressLogFormService);
  protected userProfileService = inject(UserProfileService);
  protected planService = inject(PlanService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: ProgressLogFormGroup = this.progressLogFormService.createProgressLogFormGroup();

  compareUserProfile = (o1: IUserProfile | null, o2: IUserProfile | null): boolean => this.userProfileService.compareUserProfile(o1, o2);

  comparePlan = (o1: IPlan | null, o2: IPlan | null): boolean => this.planService.comparePlan(o1, o2);

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ progressLog }) => {
      this.progressLog = progressLog;
      if (progressLog) {
        this.updateForm(progressLog);
      }

      this.loadRelationshipsOptions();
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const progressLog = this.progressLogFormService.getProgressLog(this.editForm);
    if (progressLog.id !== null) {
      this.subscribeToSaveResponse(this.progressLogService.update(progressLog));
    } else {
      this.subscribeToSaveResponse(this.progressLogService.create(progressLog));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IProgressLog>>): void {
    result.pipe(finalize(() => this.onSaveFinalize())).subscribe({
      next: () => this.onSaveSuccess(),
      error: () => this.onSaveError(),
    });
  }

  protected onSaveSuccess(): void {
    this.previousState();
  }

  protected onSaveError(): void {
    // Api for inheritance.
  }

  protected onSaveFinalize(): void {
    this.isSaving = false;
  }

  protected updateForm(progressLog: IProgressLog): void {
    this.progressLog = progressLog;
    this.progressLogFormService.resetForm(this.editForm, progressLog);

    this.userProfilesSharedCollection = this.userProfileService.addUserProfileToCollectionIfMissing<IUserProfile>(
      this.userProfilesSharedCollection,
      progressLog.profile,
    );
    this.plansSharedCollection = this.planService.addPlanToCollectionIfMissing<IPlan>(this.plansSharedCollection, progressLog.plan);
  }

  protected loadRelationshipsOptions(): void {
    this.userProfileService
      .query()
      .pipe(map((res: HttpResponse<IUserProfile[]>) => res.body ?? []))
      .pipe(
        map((userProfiles: IUserProfile[]) =>
          this.userProfileService.addUserProfileToCollectionIfMissing<IUserProfile>(userProfiles, this.progressLog?.profile),
        ),
      )
      .subscribe((userProfiles: IUserProfile[]) => (this.userProfilesSharedCollection = userProfiles));

    this.planService
      .query()
      .pipe(map((res: HttpResponse<IPlan[]>) => res.body ?? []))
      .pipe(map((plans: IPlan[]) => this.planService.addPlanToCollectionIfMissing<IPlan>(plans, this.progressLog?.plan)))
      .subscribe((plans: IPlan[]) => (this.plansSharedCollection = plans));
  }
}
