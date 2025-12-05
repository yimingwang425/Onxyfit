import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { FormatMediumDatetimePipe } from 'app/shared/date';
import { IOtpRecord } from '../otp-record.model';

@Component({
  standalone: true,
  selector: 'jhi-otp-record-detail',
  templateUrl: './otp-record-detail.component.html',
  imports: [SharedModule, RouterModule, FormatMediumDatetimePipe],
})
export class OtpRecordDetailComponent {
  otpRecord = input<IOtpRecord | null>(null);

  previousState(): void {
    window.history.back();
  }
}
