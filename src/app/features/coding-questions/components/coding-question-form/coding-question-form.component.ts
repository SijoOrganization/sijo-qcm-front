import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CodingQuestion } from '../../../../shared/models/codingQuestion.model';

@Component({
  selector: 'app-coding-question-form',
  imports: [FormsModule],
  templateUrl: './coding-question-form.component.html',
  styleUrl: './coding-question-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodingQuestionFormComponent {
  codingQuestion = model.required<CodingQuestion>();
  isEditing = input<boolean>(false);
  deleteTestCase(index: number): void {
    this.codingQuestion.update((codingQuestion) => {
      codingQuestion.testCases.splice(index, 1);
      return { ...codingQuestion };
    });
  }

  addTestCase(): void {
    this.codingQuestion.update((codingQuestion) => {
      codingQuestion.testCases.push({
        input: 'new input',
        expectedOutput: 'new output',
      });
      return { ...codingQuestion };
    });
  }

  addArgument(functionIdx: number): void {
    this.codingQuestion.update((codingQuestion) => {
      codingQuestion.functionSignatures[functionIdx].arguments.push({
        name: `arg${codingQuestion.functionSignatures[functionIdx].arguments.length + 1}`,
        type: 'new type',
      });
      return { ...codingQuestion };
    });
  }

  deleteArgument(functionIdx: number, argumentIdx: number): void {
    this.codingQuestion.update((codingQuestion) => {
      const argumentsList =
        codingQuestion.functionSignatures[functionIdx].arguments;
      argumentsList.splice(argumentIdx, 1);

      // Optionally, reset argument names or alignments
      argumentsList.forEach((arg, idx) => {
        arg.name = `arg${idx + 1}`;
      });

      return { ...codingQuestion };
    });
  }

  // deleteFunctionSignature(idx: number): void {
  //   this.codingQuestion.update((codingQuestion) => {
  //     codingQuestion.functionSignatures.splice(idx, 1);
  //     return { ...codingQuestion };
  //   });
  // }
  //
  // addFunctionSignature(): void {
  //   this.codingQuestion.update((codingQuestion) => {
  //     codingQuestion.functionSignatures.push({
  //       language: 'new language',
  //       arguments: [
  //         {
  //           name: 'arg1',
  //           type: 'type1',
  //         },
  //       ],
  //       returnType: 'new return type',
  //     });
  //     return { ...codingQuestion };
  //   });
  // }
}
