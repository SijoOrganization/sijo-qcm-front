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
  jsonQuiz = linkedSignal(() => JSON.stringify(this.getFilteredQuizForJsonEditor(this.quiz()), null, 2));
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
        })
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
    // Create a copy of the quiz and remove the placeholder ID
    const quizToCreate = { ...this.quiz() };
    // Remove the placeholder ID so the backend can generate a new one
    if (quizToCreate._id === '') {
      delete quizToCreate._id;
    }

    this.quizService.createQuiz(quizToCreate).subscribe(() => {
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
      const quiz = JSON.parse(this.jsonQuiz());
      let valid = true;
      let errorMsg = '';

      quiz.questions.forEach((q: any, idx: number) => {
        if (!q.type) {
          // Heuristique : si answers existe, c’est un QCM, sinon complétion
          if (q.answers && Array.isArray(q.answers)) {
            q.type = 'qcm';
          } else if (q.expectedAnswer) {
            q.type = 'fill-in-the-blank';
          } else {
            valid = false;
            errorMsg += `Question ${idx + 1} is missing 'type' and cannot be guessed.\n`;
          }
        }
      });

      if (!valid) {
        this.alertService.setMessage({
          message: errorMsg,
          type: 'danger',
        });
        return false;
      }

      this.quiz.set(quiz);
      this.alertService.setMessage({
        message: 'JSON is valid',
        type: 'success',
      });
      return true;
    } catch (error) {
      this.alertService.setMessage({
        message: 'Invalid JSON format. Please correct it.',
        type: 'danger',
      });
      return false;
    }
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

  private getFilteredQuizForJsonEditor(quiz: Quiz) {
    return {
      _id: quiz._id,
      title: quiz.title,
      explanation: quiz.explanation,
      category: quiz.category,
      questions: quiz.questions.map((q) => {
        if (q.type === 'qcm') {
          return {
            id: q.id,
            text: q.text,
            type: 'qcm',
            answers: (q.answers ?? []).map((a) => ({
              id: a.id,
              option: a.option,
              isCorrect: a.isCorrect ?? null,
            })),
          };
        } else if (q.type === 'fill-in-the-blank') {
          return {
            id: q.id,
            text: q.text,
            type: 'fill-in-the-blank',
            expectedAnswer: q.expectedAnswer ?? '',
          };
        }
        return {};
      }),
    };
  }
}
