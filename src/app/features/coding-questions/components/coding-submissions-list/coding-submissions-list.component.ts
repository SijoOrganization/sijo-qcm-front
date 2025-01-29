import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CodingQuestionsService } from '../../services/coding-questions.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, switchMap } from 'rxjs';
import { CodingSubmission } from '../../../../shared/models/codingQuestion.model';
import { AsyncPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-coding-submissions-list',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './coding-submissions-list.component.html',
  styleUrl: './coding-submissions-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodingSubmissionsListComponent {
  private codingQuestionsService = inject(CodingQuestionsService);
  questionId = input.required<string>();
  codingSubmissions$: Observable<CodingSubmission[]>;
  submissionSelected = output<CodingSubmission>();
  constructor() {
    this.codingSubmissions$ = toObservable(this.questionId).pipe(
      switchMap((id) =>
        this.codingQuestionsService.fetchAllSubmissionsByQuestion(id),
      ),
    );
  }
  onSubmissionClick(submission: CodingSubmission) {
    this.submissionSelected.emit(submission);
  }
}
