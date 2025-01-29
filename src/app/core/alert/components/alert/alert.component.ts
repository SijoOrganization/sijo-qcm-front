import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgbAlertModule } from '@ng-bootstrap/ng-bootstrap';
import { AlertService } from '../../services/alert.service';

@Component({
    selector: 'app-alert',
    imports: [NgbAlertModule],
    templateUrl: './alert.component.html',
    styleUrl: './alert.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlertComponent {
  alertService = inject(AlertService);
  close(){
    this.alertService.deleteMessage();
  }
}
