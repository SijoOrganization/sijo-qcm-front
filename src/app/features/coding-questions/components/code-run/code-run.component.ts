import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { CodingQuestionsService } from '../../services/coding-questions.service';
import { FormsModule } from '@angular/forms';
import { CodeExecutionResult } from '../../../../shared/models/codingQuestion.model';
import { finalize } from 'rxjs';
import { SpinnerService } from '../../../../shared/services/spinner.service';

@Component({
  selector: 'app-code-run',
  imports: [FormsModule],
  templateUrl: './code-run.component.html',
  styleUrl: './code-run.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodeRunComponent {
  code = input<string>('');
  exampleInput = input<string>();
  codingQuestionsService = inject(CodingQuestionsService);
  output = signal<CodeExecutionResult | null>(null);
  stdin = linkedSignal(() => this.exampleInput());

  private spinner = inject(SpinnerService);

  executeCode() {
    this.spinner.openGlobalSpinner();
    this.codingQuestionsService
      .executeCode(this.code(), 'java', this.stdin()!)
      .pipe(
        finalize(() => {
          this.spinner.closeGlobalSpinner();
        }),
      )

      .subscribe((codeExecutionResult: CodeExecutionResult) => {
        console.log(codeExecutionResult);
        this.output.set(codeExecutionResult);
      });
  }
  hasErrorCompilation(): boolean {
    return this.output()?.status?.id === 6;
  }
}
