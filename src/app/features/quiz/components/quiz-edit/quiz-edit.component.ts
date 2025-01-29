import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  linkedSignal,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbNavChangeEvent, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { finalize } from 'rxjs';
import { AlertService } from '../../../../core/alert/services/alert.service';
import { Quiz } from '../../../../shared/models/quiz.model';
import { SpinnerService } from '../../../../shared/services/spinner.service';
import { MockQuiz } from '../../mocks/quiz.mock';
import { QuizService } from '../../services/quiz.service';
import { QuizFormComponent } from '../quiz-form/quiz-form.component';
import { JSON_EDITOR_CONFIT } from '../../../../shared/constants/editor.const';
@Component({
  selector: 'app-quiz-edit',
  imports: [FormsModule, NgbNavModule, EditorComponent, QuizFormComponent],
  templateUrl: './quiz-edit.component.html',
  styleUrl: './quiz-edit.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizEditComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizService = inject(QuizService);
  private alertService = inject(AlertService);
  private spinnerService = inject(SpinnerService);
  private quizBase?: Quiz;
  quiz = signal<Quiz>(JSON.parse(JSON.stringify(MockQuiz)));
  active = signal(1);
  jsonQuiz = linkedSignal(() => JSON.stringify(this.quiz(), null, 2));
  editorOptions = JSON_EDITOR_CONFIT;

  ngOnInit(): void {
    const quizId = this.route.snapshot.paramMap.get('id');
    if (quizId) {
      this.fetchQuiz(quizId);
    }
  }
  generateQuiz(topics: string, nbQuestions: string) {
    this.spinnerService.openGlobalSpinner();
    this.quizService
      .generateQuiz(topics, nbQuestions)
      .pipe(
        finalize(() => {
          this.spinnerService.closeGlobalSpinner();
          this.alertService.setMessage({
            message: 'Quiz has been generated',
            type: 'success',
          });
        }),
      )
      .subscribe((result) => {
        this.jsonQuiz.set(JSON.stringify(result, null, 2));
        this.active.set(2);
      });
  }
  save(): void {
    if (!this.quiz()) {
      return;
    }

    this.quizService.updateQuiz(this.quiz()!).subscribe({
      next: (quiz) => {
        this.alertService.setMessage({
          message: 'Quiz has been updated',
          type: 'success',
        });
        this.router.navigate(['/quizzes']);
      },
      error: (err) => {
        this.alertService.setMessage({
          message: `Error while updating quiz:  ${err?.description}`,
          type: 'danger',
        });
      },
    });
  }

  reset(): void {
    if (this.quizBase) {
      this.quiz.set(this.quizBase);
    }
  }

  delete(): void {
    this.quizService.deleteQuiz(this.quiz()!).subscribe(() => {
      this.router.navigate(['/quizzes']);
      this.alertService.setMessage({
        message: 'Quiz has been deleted',
        type: 'success',
      });
    });
  }

  create(): void {
    this.quizService.createQuiz(this.quiz()!).subscribe(() => {
      this.router.navigate(['/quizzes']);
      this.quizService.fetchQuizzes();
      this.alertService.setMessage({
        message: 'Quiz has been created',
        type: 'success',
      });
    });
  }

  fetchQuiz(quizId: string) {
    this.quizService.fetchFullQuizById(quizId).subscribe((quiz) => {
      if (quiz) {
        this.quizBase = JSON.parse(JSON.stringify(quiz));
        this.quiz.set(quiz);
      }
    });
  }

  checkJson() {
    try {
      this.quiz.set(JSON.parse(this.jsonQuiz()));
    } catch (error) {
      this.alertService.setMessage({
        message: 'Invalid JSON format. Please correct it.',
        type: 'danger',
      });
      return false;
    }
    this.alertService.setMessage({
      message: 'JSON is valid',
      type: 'success',
    });
    return true;
  }

  onTabChange(event: NgbNavChangeEvent): void {
    // Change from json to form
    if (event.nextId === 1 && !this.checkJson()) {
      event.preventDefault();
    } else if (event.nextId === 2) {
      // This will force the quiz signal to change and this will also update jsonQuiz signal
      this.quiz.set({ ...this.quiz() });
    }
  }
  get isEditing() {
    return !!this.route.snapshot.paramMap.get('id');
  }
}
