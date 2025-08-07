import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import { QuizAiAdapterService } from '../../services/quiz-ai-adapter.service';
import { JavaCodeGenerator } from '../../../coding-questions/codeGenerators/java.generator';
import { PythonCodeGenerator } from '../../../coding-questions/codeGenerators/python.generator';
import { TypescriptCodeGenerator } from '../../../coding-questions/codeGenerators/typescript.generator';
import { Quiz } from '../../../../shared/models/quiz.model';
import { FunctionSignature, CodingQuestion } from '../../../../shared/models/codingQuestion.model';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CodingQuestionsService } from '../../../coding-questions/services/coding-questions.service';
import { QuizService } from '../../services/quiz.service';

@Component({
  selector: 'app-quiz-form',
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-form.component.html',
  styleUrl: './quiz-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizFormComponent {
  private router = inject(Router);
  private codingQuestionsService = inject(CodingQuestionsService);
  private quizService = inject(QuizService);
  private quizAiAdapter = inject(QuizAiAdapterService);

  quiz = model.required<Quiz>();
  isEditing = input<Boolean>(false);

  // Quiz taking state
  selectedQuestionIdx = signal<number>(0);
  quizAnswers = signal<{ [questionId: string]: string }>({});
  quizCode = signal<{ [questionId: string]: string }>({});
  quizInput = signal<{ [questionId: string]: string }>({});
  quizCodeResult = signal<{ [questionId: string]: any }>({});
  codeTemplates = signal<{ [questionId: string]: string }>({});
  quizFinished = signal<boolean>(false);
  quizScore = signal<number>(0);

  // Computed properties
  questions = computed(() => this.quiz()?.questions || []);
  currentQuestion = computed(() => {
    const questions = this.questions();
    const selectedIdx = this.selectedQuestionIdx();
    return questions[selectedIdx] || null;
  });

  constructor() {
    // Initialize code templates when quiz changes
    effect(() => {
      this.initializeCodeTemplates();
    });
  }

  private initializeCodeTemplates() {
    const quiz = this.quiz();
    if (quiz?.questions) {
      const templates: { [questionId: string]: string } = {};
      quiz.questions.forEach((question) => {
        if (question.type === 'coding') {
          templates[question.id] = this.generateCodeTemplate(question);
        }
      });
      this.codeTemplates.set(templates);
    }
  }

  // Quiz navigation methods
  selectQuestion(index: number) {
    this.selectedQuestionIdx.set(index);
  }

  // Quiz submission methods
  finishQuiz() {
    this.calculateScore();
    this.quizFinished.set(true);
  }

  private calculateScore() {
    const questions = this.questions();
    const answers = this.quizAnswers();
    const codeAnswers = this.quizCode();
    
    if (questions.length === 0) {
      this.quizScore.set(0);
      return;
    }

    let correctAnswers = 0;
    
    questions.forEach((question) => {
      if (question.type === 'qcm') {
        const userAnswer = answers[question.id];
        const correctAnswer = question.answers?.find(ans => ans.isCorrect);
        if (userAnswer === correctAnswer?.id) {
          correctAnswers++;
        }
      } else if (question.type === 'fill-in-the-blank') {
        const userAnswer = answers[question.id]?.toLowerCase().trim();
        const expectedAnswer = question.expectedAnswer?.toLowerCase().trim();
        if (userAnswer === expectedAnswer) {
          correctAnswers++;
        }
      } else if (question.type === 'coding') {
        // For coding questions, we'll consider it correct if there's code
        // In a real implementation, this would run test cases
        const userCode = codeAnswers[question.id];
        if (userCode && userCode.trim().length > 0) {
          correctAnswers++;
        }
      }
    });

    const score = Math.round((correctAnswers / questions.length) * 100);
    this.quizScore.set(score);
  }

  // Code testing methods
  testCode(questionId: string | undefined) {
    if (!questionId) return;
    
    const code = this.quizCode()[questionId];
    const input = this.quizInput()[questionId] || '';
    const question = this.questions().find(q => q.id === questionId);
    
    if (!code || !question) {
      return;
    }

    this.codingQuestionsService.executeCode(code, question.language, input)
      .subscribe({
        next: (result) => {
          this.quizCodeResult.update(results => ({
            ...results,
            [questionId]: result
          }));
        },
        error: (error) => {
          console.error('Code execution error:', error);
          this.quizCodeResult.update(results => ({
            ...results,
            [questionId]: { error: 'Execution failed', details: error.message }
          }));
        }
      });
  }

  // Navigation methods
  backToList() {
    this.router.navigate(['/quizzes']);
  }

  // Question creation and editing
  newCoding: {
    text: string;
    language: string;
    difficulty: 'easy' | 'medium' | 'hard';
    validity: boolean;
    code: string;
    testCases: any[];
    functionSignatures: FunctionSignature[];
    functionName: string;
  } = {
    text: '',
    language: 'Java',
    difficulty: 'easy',
    validity: true,
    code: '',
    testCases: [],
    functionSignatures: [],
    functionName: 'solution',
  };

  addQuestion(type: 'qcm' | 'fill-in-the-blank' | 'coding' = 'qcm'): void {
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
          language: 'Java', // valeur par défaut ou à adapter
          difficulty: 'easy', // valeur par défaut ou à adapter
          validity: true, // valeur par défaut
        });
      } else if (type === 'fill-in-the-blank') {
        quiz?.questions.push({
          id: newId,
          text: '',
          type: 'fill-in-the-blank',
          expectedAnswer: '',
          language: 'Java', // valeur par défaut ou à adapter
          difficulty: 'easy', // valeur par défaut ou à adapter
          validity: true, // valeur par défaut
        });
      } else if (type === 'coding') {
        const defaultSignature: FunctionSignature = {
          language: this.newCoding.language!,
          arguments: [],
          returnType: 'void',
        };
        quiz?.questions.push({
          id: newId,
          type: 'coding',
          text: this.newCoding.text!,
          language: this.newCoding.language!,
          difficulty: this.newCoding.difficulty!,
          validity: !!this.newCoding.validity,
          code: this.newCoding.code!,
          testCases: JSON.parse(JSON.stringify(this.newCoding.testCases!)),
          functionSignatures:
            this.newCoding.functionSignatures && this.newCoding.functionSignatures.length > 0
              ? this.newCoding.functionSignatures
              : [defaultSignature],
          functionName: this.newCoding.functionName || 'solution',
        });
      }
      return { ...quiz };
    });
    this.initializeCodeTemplates();
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
    this.initializeCodeTemplates();
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
    this.quiz.update((quiz) => {
      if (quiz?.questions[idx]) {
        quiz.questions[idx].type = newType;
      }
      return { ...quiz };
    });
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

  generateCodeTemplate(q: any): string {
    if (q.type !== 'coding') {
      return '';
    }

    try {
      // Convertir la question AI au format CodingQuestion compatible
      const codingQuestion = this.quizAiAdapter.convertAiQuestionToCoding(q, q.language || 'java');
      const language = (q.language || 'java').toLowerCase();
      
      // Trouver la signature correspondante au langage
      const signature = codingQuestion.functionSignatures.find(
        (sig: FunctionSignature) => sig.language.toLowerCase() === language
      );
      
      if (!signature) {
        console.warn(`No signature found for language: ${language}`);
        return this.generateFallbackTemplate(q, language);
      }
      
      // Utiliser les générateurs existants de "all coding questions"
      switch (language) {
        case 'java':
          return JavaCodeGenerator.generateJavaCode(codingQuestion, signature);
        case 'python':
          return PythonCodeGenerator.generatePythonCode(codingQuestion, signature);
        case 'typescript':
        case 'javascript':
          return TypescriptCodeGenerator.generateTypescriptCode(codingQuestion, signature);
        default:
          return JavaCodeGenerator.generateJavaCode(codingQuestion, signature);
      }
    } catch (error) {
      console.error('Error generating code template for AI quiz question:', error);
      // Fallback vers une méthode simple
      return this.generateFallbackTemplate(q, q.language || 'java');
    }
  }

  private generateFallbackTemplate(q: any, language: string): string {
    const functionName = q.functionName || 'solve';
    const normalizedLanguage = language.toLowerCase();
    
    switch (normalizedLanguage) {
      case 'java':
        return `public int ${functionName}(int input) {
    // TODO: Implémentez votre solution ici
    return 0;
}`;
      case 'python':
        return `def ${functionName}(input):
    # TODO: Implémentez votre solution ici
    return 0`;
      case 'javascript':
      case 'typescript':
        return `function ${functionName}(input) {
    // TODO: Implémentez votre solution ici
    return 0;
}`;
      case 'c++':
        return `int ${functionName}(int input) {
    // TODO: Implémentez votre solution ici
    return 0;
}`;
      default:
        return `// Template pour ${language}
int ${functionName}(int input) {
    // TODO: Implémentez votre solution ici
    return 0;
}`;
    }
  }

  // Helper methods for template binding
  getQuizAnswer(questionId: string | undefined): string {
    if (!questionId) return '';
    return this.quizAnswers()[questionId] || '';
  }

  updateQuizAnswer(questionId: string | undefined, value: string | Event) {
    if (!questionId) return;
    
    let actualValue: string;
    if (typeof value === 'string') {
      actualValue = value;
    } else {
      actualValue = (value.target as HTMLInputElement).value;
    }
    
    this.quizAnswers.update(answers => ({
      ...answers,
      [questionId]: actualValue
    }));
  }

  getQuizCode(questionId: string | undefined): string {
    if (!questionId) return '';
    return this.quizCode()[questionId] || '';
  }

  updateQuizCode(questionId: string | undefined, event: Event) {
    if (!questionId) return;
    
    const value = (event.target as HTMLTextAreaElement).value;
    this.quizCode.update(code => ({
      ...code,
      [questionId]: value
    }));
  }

  getQuizInput(questionId: string | undefined): string {
    if (!questionId) return '';
    return this.quizInput()[questionId] || '';
  }

  updateQuizInput(questionId: string | undefined, event: Event) {
    if (!questionId) return;
    
    const value = (event.target as HTMLTextAreaElement).value;
    this.quizInput.update(input => ({
      ...input,
      [questionId]: value
    }));
  }

  getQuizCodeResult(questionId: string | undefined): any {
    if (!questionId) return null;
    return this.quizCodeResult()[questionId];
  }

  getCodeTemplate(questionId: string | undefined): string {
    if (!questionId) return '';
    return this.codeTemplates()[questionId] || '';
  }
}
