import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-finish-confirmation',
    imports: [],
    templateUrl: './finish-confirmation.component.html',
    styleUrl: './finish-confirmation.component.css'
})
export class FinishConfirmationComponent {
  modal = inject(NgbActiveModal);
}
