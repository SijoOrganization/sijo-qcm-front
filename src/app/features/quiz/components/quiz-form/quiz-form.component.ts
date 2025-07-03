import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { Quiz } from '../../../../shared/models/quiz.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-quiz-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-form.component.html',
  styleUrl: './quiz-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizFormComponent {
  quiz = model.required<Quiz>();
  isEditing = input<Boolean>(false);

  addQuestion(type: 'qcm' | 'fill-in-the-blank' = 'qcm'): void {
    this.quiz.update((quiz) => {
      const newId = `q${(quiz?.questions.length || 0) + 1}`;
      if (type === 'qcm') {
        quiz?.questions.push({
          id: newId,
          text: '',
          type: 'qcm',
          answers: [
            { id: 'a1', option: '', isCorrect: false },
            { id: 'a2', option: '', isCorrect: false },
          ],
        });
      } else {
        quiz?.questions.push({
          id: newId,
          text: '',
          type: 'fill-in-the-blank',
          expectedAnswer: '',
        });
      }
      return { ...quiz };
    });
    this.quiz.set({ ...this.quiz() }); // <-- force la synchro
  }

  addAnswer(idxQuestion: number) {
    this.quiz.update((quiz) => {
      const question = quiz?.questions[idxQuestion];
      if (question) {
        if (!question.answers) {
          question.answers = [];
        }
        question.answers.push({
          id: `a${question.answers.length + 1}`,
          option: 'new option',
        });
      }
      return { ...quiz };
    });
    this.quiz.set({ ...this.quiz() }); // <-- force la synchro
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
    this.quiz.set({ ...this.quiz() }); // <-- force la synchro
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
    this.quiz.set({ ...this.quiz() }); // <-- force la synchro
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  trackByQuestionId(index: number, question: any) {
    return question.id;
  }

  onTypeChange(idx: number, newType: 'qcm' | 'fill-in-the-blank') {
    this.quiz().questions[idx].type = newType;
    this.quiz.set({ ...this.quiz() }); // <-- force la synchro avec le JSON Editor
  }

  saveQuiz() {
    const quiz = this.quiz();
    const quizToSave = this.getFilteredQuizForJsonEditor(quiz);
    console.log(JSON.stringify(quizToSave, null, 2));
    // ...envoi quizToSave au backend...
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
