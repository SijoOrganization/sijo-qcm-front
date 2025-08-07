import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { QuizService } from '../../services/quiz.service';
import { Quiz } from '../../../../shared/models/quiz.model';
import { NewlinePipe } from '../../../../shared/pipes/newline.pipe';
import { QuizHistoryComponent } from '../quiz-history/quiz-history.component';
import { SubmissionService } from '../../services/submission.service';
import { combineLatest, finalize } from 'rxjs';
import { Submission } from '../../../../shared/models/submission.model';
import { SpinnerService } from '../../../../shared/services/spinner.service';

@Component({
  selector: 'app-quiz-info',
  standalone: true,
  imports: [CommonModule, RouterModule, QuizHistoryComponent, NewlinePipe],
  templateUrl: './quiz-info.component.html',
  styleUrl: './quiz-info.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizInfoComponent implements OnInit {
  // Signals for the new template
  quiz = signal<Quiz | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Legacy signals for compatibility
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
      this.error.set('Quiz ID not found');
      this.isLoading.set(false);
      return;
    }
    
    this.isLoading.set(true);
    this.spinner.openGlobalSpinner();
    combineLatest([
      this.quizService.fetchQuizInfo(quizId),
      this.submissionService.fetchSubmissionsIdList(quizId),
    ])
      .pipe(
        finalize(() => {
          this.spinner.closeGlobalSpinner();
          this.isLoading.set(false);
        }),
      )
      .subscribe({
        next: ([quiz, submissions]) => {
          this.quiz.set(quiz);
          this.quizSignal.set(quiz); // Keep for legacy compatibility
          this.submissions = submissions;
        },
        error: (err) => {
          console.error('Error loading quiz:', err);
          this.error.set('Failed to load quiz');
        }
      });
  }

  start() {
    this.router.navigate(['take'], { relativeTo: this.route });
  }

  // New methods for the enhanced template
  startQuiz() {
    const quiz = this.quiz();
    if (quiz) {
      this.router.navigate(['/quizzes', quiz._id, 'take']);
    }
  }

  editQuiz() {
    const quiz = this.quiz();
    if (quiz) {
      this.router.navigate(['/quizzes', quiz._id, 'edit']);
    }
  }

  practiceQuiz() {
    const quiz = this.quiz();
    if (quiz && quiz.isValidated) {
      this.router.navigate(['/quizzes/practice'], {
        state: { selectedQuiz: quiz },
      });
    }
  }

  getDifficultyColor(difficulty?: string): string {
    switch (difficulty) {
      case 'easy':
        return 'success';
      case 'medium':
        return 'warning';
      case 'hard':
        return 'danger';
      case 'mixed':
        return 'info';
      default:
        return 'secondary';
    }
  }

  getDifficultyIcon(difficulty?: string): string {
    switch (difficulty) {
      case 'easy':
        return 'fas fa-leaf';
      case 'medium':
        return 'fas fa-fire';
      case 'hard':
        return 'fas fa-skull';
      case 'mixed':
        return 'fas fa-random';
      default:
        return 'fas fa-question';
    }
  }

  getQuestionTypeIcon(type: string): string {
    switch (type) {
      case 'qcm':
        return 'fas fa-list-ul';
      case 'fill-in-the-blank':
        return 'fas fa-edit';
      case 'coding':
        return 'fas fa-code';
      default:
        return 'fas fa-question-circle';
    }
  }

  getQuestionTypeName(type: string): string {
    switch (type) {
      case 'qcm':
        return 'Multiple Choice';
      case 'fill-in-the-blank':
        return 'Fill in the Blank';
      case 'coding':
        return 'Coding';
      default:
        return 'Unknown';
    }
  }
}
