import { Component, input } from '@angular/core';
import { RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { FormatMediumDatePipe, FormatMediumDatetimePipe } from 'app/shared/date';
import { IProgressLog } from '../progress-log.model';

@Component({
  standalone: true,
  selector: 'jhi-progress-log-detail',
  templateUrl: './progress-log-detail.component.html',
  imports: [SharedModule, RouterModule, FormatMediumDatetimePipe, FormatMediumDatePipe],
})
export class ProgressLogDetailComponent {
  progressLog = input<IProgressLog | null>(null);

  previousState(): void {
    window.history.back();
  }
}
