import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IProgressLog } from '../progress-log.model';
import { ProgressLogService } from '../service/progress-log.service';

@Component({
  standalone: true,
  templateUrl: './progress-log-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ProgressLogDeleteDialogComponent {
  progressLog?: IProgressLog;

  protected progressLogService = inject(ProgressLogService);
  protected activeModal = inject(NgbActiveModal);

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: number): void {
    this.progressLogService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
