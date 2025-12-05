import { Component, OnInit, inject } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import SharedModule from 'app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IOtpRecord } from '../otp-record.model';
import { OtpRecordService } from '../service/otp-record.service';
import { OtpRecordFormGroup, OtpRecordFormService } from './otp-record-form.service';

@Component({
  standalone: true,
  selector: 'jhi-otp-record-update',
  templateUrl: './otp-record-update.component.html',
  imports: [SharedModule, FormsModule, ReactiveFormsModule],
})
export class OtpRecordUpdateComponent implements OnInit {
  isSaving = false;
  otpRecord: IOtpRecord | null = null;

  protected otpRecordService = inject(OtpRecordService);
  protected otpRecordFormService = inject(OtpRecordFormService);
  protected activatedRoute = inject(ActivatedRoute);

  // eslint-disable-next-line @typescript-eslint/member-ordering
  editForm: OtpRecordFormGroup = this.otpRecordFormService.createOtpRecordFormGroup();

  ngOnInit(): void {
    this.activatedRoute.data.subscribe(({ otpRecord }) => {
      this.otpRecord = otpRecord;
      if (otpRecord) {
        this.updateForm(otpRecord);
      }
    });
  }

  previousState(): void {
    window.history.back();
  }

  save(): void {
    this.isSaving = true;
    const otpRecord = this.otpRecordFormService.getOtpRecord(this.editForm);
    if (otpRecord.id !== null) {
      this.subscribeToSaveResponse(this.otpRecordService.update(otpRecord));
    } else {
      this.subscribeToSaveResponse(this.otpRecordService.create(otpRecord));
    }
  }

  protected subscribeToSaveResponse(result: Observable<HttpResponse<IOtpRecord>>): void {
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

  protected updateForm(otpRecord: IOtpRecord): void {
    this.otpRecord = otpRecord;
    this.otpRecordFormService.resetForm(this.editForm, otpRecord);
  }
}
