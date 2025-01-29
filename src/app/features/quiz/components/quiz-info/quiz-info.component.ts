import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { Quiz } from '../../../../shared/models/quiz.model';
import { QuizHistoryComponent } from '../quiz-history/quiz-history.component';
import { SubmissionService } from '../../services/submission.service';
import { combineLatest, finalize } from 'rxjs';
import { Submission } from '../../../../shared/models/submission.model';
import { SpinnerService } from '../../../../shared/services/spinner.service';

@Component({
  selector: 'app-quiz-info',
  imports: [QuizHistoryComponent],
  templateUrl: './quiz-info.component.html',
  styleUrl: './quiz-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizInfoComponent {
  quizSignal = signal<Quiz | null>(null);
  submissions: Submission[] = [];

  private route = inject(ActivatedRoute);
  private quizService = inject(QuizService);
  private submissionService = inject(SubmissionService);
  private router = inject(Router);
  private spinner = inject(SpinnerService);

  ngOnInit(): void {
    const quizId = this.route.snapshot.paramMap.get('id');
    if (!quizId) {
      return;
    }
    this.spinner.openGlobalSpinner();
    combineLatest([
      this.quizService.fetchQuizInfo(quizId),
      this.submissionService.fetchSubmissionsIdList(quizId),
    ])
      .pipe(
        finalize(() => {
          this.spinner.closeGlobalSpinner();
        }),
      )
      .subscribe(([quiz, submissions]) => {
        this.quizSignal.set(quiz);
        this.submissions = submissions;
      });
  }

  start() {
    this.router.navigate(['take'], { relativeTo: this.route });
  }
}
