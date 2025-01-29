import {
  ChangeDetectionStrategy,
  Component,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbNavChangeEvent, NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { AlertService } from '../../../../core/alert/services/alert.service';
import { JSON_EDITOR_CONFIT } from '../../../../shared/constants/editor.const';
import { CodingQuestion } from '../../../../shared/models/codingQuestion.model';
import { SpinnerService } from '../../../../shared/services/spinner.service';
import { MOCK_CODING_QUESTION } from '../../mocks/coding-questions.mock';
import { CodingQuestionsService } from '../../services/coding-questions.service';
import { CodingQuestionFormComponent } from '../coding-question-form/coding-question-form.component';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-coding-question-edit',
  imports: [
    FormsModule,
    NgbNavModule,
    EditorComponent,
    CodingQuestionFormComponent,
  ],
  templateUrl: './coding-question-edit.component.html',
  styleUrl: './coding-question-edit.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodingQuestionEditComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alertService = inject(AlertService);
  private spinnerService = inject(SpinnerService);
  private questionBase?: CodingQuestion;
  private codingQuestionService = inject(CodingQuestionsService);

  active = signal(1);
  question = signal<CodingQuestion>(MOCK_CODING_QUESTION);
  jsonQuestion = linkedSignal(() => JSON.stringify(this.question(), null, 2));
  editorOptions = JSON_EDITOR_CONFIT;
  ngOnInit(): void {
    const questionId = this.route.snapshot.paramMap.get('id');
    if (questionId) {
      this.fetchQuestion(questionId);
    }
  }
  fetchQuestion(codingQuestionId: string): void {
    this.codingQuestionService
      .fetchCodingQuestion(codingQuestionId)
      .subscribe((question: CodingQuestion) => {
        this.question.set(question);
        this.questionBase = question;
      });
  }
  reset(): void {
    if (this.questionBase) {
      this.question.set(this.questionBase);
    }
  }
  delete(): void {
    this.codingQuestionService
      .deleteCodingQuestion(this.question())
      .subscribe(() => {
        this.router.navigate(['/coding-questions']);
        this.alertService.setMessage({
          message: 'Question has been deleted',
          type: 'success',
        });
      });
  }

  create(): void {
    this.codingQuestionService
      .createCodingQuestion(this.question())
      .subscribe(() => {
        this.router.navigate(['/coding-questions']);
        this.alertService.setMessage({
          message: 'Coding question has been created',
          type: 'success',
        });
      });
  }
  save(): void {
    this.codingQuestionService
      .updateCodingQuestion(this.question())
      .subscribe(() => {
        this.alertService.setMessage({
          message: 'Question has been updated',
          type: 'success',
        });
        this.router.navigate(['/coding-questions']);
      });
  }
  checkJson(): boolean {
    try {
      this.question.set(JSON.parse(this.jsonQuestion()));
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

  generateQuestion(topics: string) {
    this.spinnerService.openGlobalSpinner();
    this.codingQuestionService
      .generateQuestion(topics)
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
        this.jsonQuestion.set(JSON.stringify(result, null, 2));
        this.active.set(2);
      });
  }
  onTabChange(event: NgbNavChangeEvent): void {
    // Change from json to form
    if (event.nextId === 1 && !this.checkJson()) {
      event.preventDefault();
    } else if (event.nextId === 2) {
      this.question.set({ ...this.question() });
    }
  }
  get isEditing() {
    return !!this.route.snapshot.paramMap.get('id');
  }
}
