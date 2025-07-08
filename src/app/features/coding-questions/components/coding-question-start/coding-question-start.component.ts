import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap';
import { EditorComponent } from 'ngx-monaco-editor-v2';
import { finalize } from 'rxjs';
import { AlertService } from '../../../../core/alert/services/alert.service';
import {
  CodingQuestion,
  CodingSubmission,
} from '../../../../shared/models/codingQuestion.model';
import { SpinnerService } from '../../../../shared/services/spinner.service';
import { JavaCodeGenerator } from '../../codeGenerators/java.generator';
import { PythonCodeGenerator } from '../../codeGenerators/python.generator';
import { TypescriptCodeGenerator } from '../../codeGenerators/typescript.generator';
import { CodingQuestionsService } from '../../services/coding-questions.service';
import { CodeRunComponent } from '../code-run/code-run.component';
import { CodingSubmissionDetailsComponent } from '../coding-submission-details/coding-submission-details.component';
import { CodingSubmissionsListComponent } from '../coding-submissions-list/coding-submissions-list.component';

@Component({
  selector: 'app-coding-question-start',
  standalone: true,
  imports: [
    EditorComponent,
    CodeRunComponent,
    FormsModule,
    NgbNavModule,
    CodingSubmissionsListComponent,
    CodingSubmissionDetailsComponent,
  ],
  templateUrl: './coding-question-start.component.html',
  styleUrl: './coding-question-start.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodingQuestionStartComponent implements OnInit {
  codingQuestionsService = inject(CodingQuestionsService);
  alertService = inject(AlertService);
  codingQuestion = signal<CodingQuestion | null>(null);
  active = 'description';
  currentSubmission = signal<CodingSubmission | null>(null);

  private route = inject(ActivatedRoute);
  private spinner = inject(SpinnerService);

  editorOptions = { language: 'java' };
  code = '';
  selectedLanguage = 'java';

  ngOnInit(): void {
    const questionId = this.route.snapshot.paramMap.get('id');
    if (questionId) {
      this.codingQuestionsService
        .getCodingQuestion(questionId)
        .subscribe((question) => {
          this.codingQuestion.set(question);
          this.code = this.generateFunctionTemplate(question, this.selectedLanguage);
        });
    }
  }

  generateFunctionTemplate(
    codingQuestion: CodingQuestion,
    language: string,
  ): string {
    const signature = codingQuestion.functionSignatures.find(
      (sig) => sig.language.toLowerCase() === language.toLowerCase(),
    );
    if (!signature) {
      throw new Error(`Function signature not found for language: ${language}`);
    }
    switch (language.toLowerCase()) {
      case 'java':
        return JavaCodeGenerator.generateJavaCode(codingQuestion, signature);
      case 'python':
        return PythonCodeGenerator.generatePythonCode(codingQuestion, signature);
      case 'typescript':
        return TypescriptCodeGenerator.generateTypescriptCode(codingQuestion, signature);
      default:
        return '// No template available for this language';
    }
  }
  editorKey=0
  updateCodeTemplate() {
    const question = this.codingQuestion();
    if (question) {
      this.code = this.generateFunctionTemplate(question, this.selectedLanguage);
      this.editorKey++;
  }
}

  submitSolution() {
    if (this.codingQuestion()) {
      this.spinner.openGlobalSpinner();
      this.codingQuestionsService
        .submitCodingQuestion(this.codingQuestion()!.id!, this.selectedLanguage, this.code)
        .pipe(
          finalize(() => {
            this.spinner.closeGlobalSpinner();
          }),
        )
        .subscribe({
          next: (codingSubmission: CodingSubmission) => {
            this.alertService.setMessage({
              type: 'success',
              message: 'Code has been submitted',
            });
            this.selectSubmission(codingSubmission);
          },
        });
    }
  }

  createExampleInput() {
    return this.codingQuestion()?.testCases[0]?.input;
  }

  selectSubmission(submission: CodingSubmission) {
    this.currentSubmission.set(submission);
    this.active = 'submission-detail';
  }

  get monacoOptions() {
    return {
      ...this.editorOptions,
      language: this.selectedLanguage,
    };
  }
}
