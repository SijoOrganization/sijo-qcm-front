import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  language = input<string>('java'); // <-- Changé de 'python' à 'java' pour correspondre au défaut du parent

  codingQuestionsService = inject(CodingQuestionsService);
  output = signal<CodeExecutionResult | null>(null);
  stdin = linkedSignal(() => this.exampleInput()!);

  private spinner = inject(SpinnerService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    // Ajoute cet effet pour suivre les changements
    effect(() => {
      // Réinitialise l'output quand le langage change
      this.output.set(null);
    });
  }

  executeCode() {
    this.spinner.openGlobalSpinner();
    this.codingQuestionsService
      .executeCode(this.code(), this.language(), this.stdin()!)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.spinner.closeGlobalSpinner();
        }),
      )
      .subscribe({
        next: (codeExecutionResult: CodeExecutionResult) => {
          this.output.set(codeExecutionResult);
        },
        error: (error) => {
          console.error('Error executing code:', error);
          this.output.set(null);
        }
      });
  }
  hasErrorCompilation(): boolean {
    return this.output()?.status?.id === 6;
  }
}
