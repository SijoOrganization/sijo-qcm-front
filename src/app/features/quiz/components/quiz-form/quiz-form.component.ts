import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { Quiz } from '../../../../shared/models/quiz.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-quiz-form',
  imports: [FormsModule],
  templateUrl: './quiz-form.component.html',
  styleUrl: './quiz-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizFormComponent {
  quiz = model.required<Quiz>();
  isEditing = input<Boolean>(false);

  addQuestion(): void {
    this.quiz.update((quiz) => {
      const newId = `q${(quiz?.questions.length || 0) + 1}`;
      quiz?.questions.push({
        id: newId,
        text: 'Text sample',
        answers: [
          { id: 'a1', option: 'option 1', isCorrect: true },
          { id: 'a2', option: 'option 2' },
          { id: 'a3', option: 'option 3' },
        ],
      });
      return { ...quiz };
    });
  }

  addAnswer(idxQuestion: number) {
    this.quiz.update((quiz) => {
      quiz?.questions[idxQuestion].answers.push({
        id: `a${quiz?.questions[idxQuestion].answers.length + 1}`,
        option: 'new option',
      });
      ``;
      return { ...quiz };
    });
  }

  deleteAnswer(questionIndex: number, answerIndex: number) {
    this.quiz.update((quiz) => {
      const answers = quiz?.questions[questionIndex].answers;
      answers?.splice(answerIndex, 1);

      answers?.forEach((answer, idx) => {
        answer.id = `a${idx + 1}`;
      });

      return { ...quiz };
    });
  }
  deleteQuestion(questionIndex: number) {
    this.quiz.update((quiz) => {
      const questions = quiz?.questions;
      questions?.splice(questionIndex, 1);

      // Re-align question IDs and their answers' IDs
      questions?.forEach((question, qIdx) => {
        question.id = `q${qIdx + 1}`;
      });

      return { ...quiz };
    });
  }
}
