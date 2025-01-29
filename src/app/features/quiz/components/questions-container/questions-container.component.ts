import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  Quiz,
  QuizAnswer,
} from '../../../../shared/models/quiz.model';
import { QuizService } from '../../services/quiz.service';
import { FinishConfirmationComponent } from '../finish-confirmation/finish-confirmation.component';
import { Router } from '@angular/router';
import { SubmissionConfirmation } from '../../../../shared/models/submission.model';

@Component({
    selector: 'app-questions-container',
    imports: [],
    templateUrl: './questions-container.component.html',
    styleUrl: './questions-container.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuestionsContainerComponent implements OnInit {
  quiz = input.required<Quiz>();
  modalService = inject(NgbModal);
  quizService = inject(QuizService);
  router = inject(Router);

  selectedResponses: WritableSignal<QuizAnswer> = signal({});

  ngOnInit(): void {
    const newRecord: Record<string, Set<string>> = {};
    this.quiz().questions.forEach((question) => {
      newRecord[question.id] = new Set();
    });
    this.selectedResponses.set(newRecord);
  }

  selectAnswer(questionId: string, answerId: string): void {
    this.selectedResponses.update((currentSelection) => {
      const answerSet = currentSelection[questionId];
      if (answerSet.has(answerId)) {
        answerSet.delete(answerId);
      } else {
        answerSet.add(answerId);
      }
      return currentSelection;
    });
  }

  openFinishConfirmationPopup() {
    this.modalService.open(FinishConfirmationComponent).closed.subscribe(() => {
      this.submit();
    });
  }
  private submit() {
    this.quizService
      .submit(this.selectedResponses(), this.quiz()._id!)
      .subscribe((confirmation: SubmissionConfirmation) => {
        this.router.navigate([`/submissions/${confirmation.submissionId}`]);
      });
  }
}
