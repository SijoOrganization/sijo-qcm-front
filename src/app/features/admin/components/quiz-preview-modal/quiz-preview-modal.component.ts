import { Component, EventEmitter, Input, Output, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Quiz, Question } from '../../../../shared/models/quiz.model';
import { QuizService } from '../../../quiz/services/quiz.service';
import { NewlinePipe } from '../../../../shared/pipes/newline.pipe';

@Component({
  selector: 'app-quiz-preview-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, NewlinePipe],
  templateUrl: './quiz-preview-modal.component.html',
  styleUrl: './quiz-preview-modal.component.css'
})
export class QuizPreviewModalComponent implements OnInit {
  @Input() set quiz(value: Quiz | null) {
    this._quiz.set(value);
  }
  get quiz() {
    return this._quiz();
  }
  
  // Make _quiz public so it can be used in template
  _quiz = signal<Quiz | null>(null);
  
  @Output() closed = new EventEmitter<void>();
  @Output() quizValidated = new EventEmitter<Quiz>();
  @Output() quizEditRequested = new EventEmitter<Quiz>();

  private quizService = inject(QuizService);

  quizWithQuestions = signal<Quiz | null>(null);
  currentQuestionIndex = signal<number>(0);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string>('');

  currentQuestion = computed(() => {
    const quiz = this.quizWithQuestions();
    const index = this.currentQuestionIndex();
    return quiz?.questions?.[index] || null;
  });

  totalQuestions = computed(() => {
    const quiz = this.quizWithQuestions();
    return quiz?.questions?.length || 0;
  });

  codingQuestionsCount = computed(() => {
    const quiz = this._quiz();
    if (!quiz?.questions) return 0;
    return quiz.questions.filter((q: Question) => q.type === 'coding').length;
  });

  theoricalQuestionsCount = computed(() => {
    const quiz = this._quiz();
    if (!quiz?.questions) return 0;
    return quiz.questions.filter((q: Question) => q.type !== 'coding').length;
  });

  ngOnInit() {
    this.loadQuizWithQuestions();
  }

  private loadQuizWithQuestions() {
    const quiz = this._quiz();
    if (!quiz?._id) {
      this.errorMessage.set('ID du quiz manquant');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // For admin, we need to fetch the quiz with complete questions including correct answers
    this.quizService.fetchQuizForAdmin(quiz._id).subscribe({
      next: (quizWithQuestions) => {
        this.quizWithQuestions.set(quizWithQuestions);
        this.currentQuestionIndex.set(0);
        this.isLoading.set(false);
        console.log('Admin quiz loaded with questions:', quizWithQuestions);
      },
      error: (error) => {
        console.error('Error loading quiz questions for admin:', error);
        this.errorMessage.set('Erreur lors du chargement des questions du quiz');
        this.isLoading.set(false);
      }
    });
  }

  setCurrentQuestion(index: number) {
    this.currentQuestionIndex.set(index);
  }

  nextQuestion() {
    const quiz = this.quizWithQuestions();
    if (quiz && this.currentQuestionIndex() < quiz.questions.length - 1) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
    }
  }

  previousQuestion() {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
    }
  }

  getCorrectAnswerText(): string {
    const question = this.currentQuestion();
    if (!question || question.type !== 'qcm' || !question.answers) {
      return 'Non disponible';
    }
    
    const correctAnswer = question.answers.find(answer => answer.isCorrect);
    if (!correctAnswer) {
      return 'Non spécifiée';
    }
    
    const index = question.answers.indexOf(correctAnswer);
    return `${this.getOptionLetter(index)}) ${correctAnswer.option}`;
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  validateQuiz() {
    const quiz = this._quiz();
    if (quiz) {
      this.quizValidated.emit(quiz);
    }
  }

  editQuiz() {
    const quiz = this._quiz();
    if (quiz) {
      this.quizEditRequested.emit(quiz);
    }
  }

  closeModal() {
    this.closed.emit();
  }
}
