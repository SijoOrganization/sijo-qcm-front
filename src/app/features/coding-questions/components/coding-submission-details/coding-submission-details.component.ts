import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CodingSubmission } from '../../../../shared/models/codingQuestion.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-coding-submission-details',
  imports: [DatePipe],
  templateUrl: './coding-submission-details.component.html',
  styleUrl: './coding-submission-details.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodingSubmissionDetailsComponent {
  submissionInput = input<CodingSubmission>();
}
