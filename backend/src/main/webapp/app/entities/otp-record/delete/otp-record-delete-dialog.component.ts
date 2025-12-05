import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IOtpRecord } from '../otp-record.model';
import { OtpRecordService } from '../service/otp-record.service';

@Component({
  standalone: true,
  templateUrl: './otp-record-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class OtpRecordDeleteDialogComponent {
  otpRecord?: IOtpRecord;

  protected otpRecordService = inject(OtpRecordService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.otpRecordService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
