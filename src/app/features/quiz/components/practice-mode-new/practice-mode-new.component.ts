import { Component, signal, inject, ChangeDetectionStrategy, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { Quiz, Question } from '../../../../shared/models/quiz.model';

interface SessionResults {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  answers: { question: Question; userAnswer: any; isCorrect: boolean }[];
}

@Component({
  selector: 'app-practice-mode',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './practice-mode-new.component.html',
  styleUrl: './practice-mode-new.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PracticeModeComponent implements OnInit {
  private quizService = inject(QuizService);
  private router = inject(Router);

  // Available validated quizzes
  availableQuizzes = computed(() => 
    this.quizService.quizzes().filter(quiz => quiz.isValidated)
  );
  
  // Selected quiz for practice
  selectedQuiz = signal<Quiz | null>(null);
  
  // Current practice session
  currentQuestion = signal<Question | null>(null);
  currentQuestionIndex = signal(0);
  practiceQuestions = signal<Question[]>([]);
  userAnswers = signal<{[questionId: string]: any}>({});
  
  // Session results
  sessionResults = signal<SessionResults | null>(null);

  // Statistics
  practiceStats = signal({
    totalQuestions: 0,
    completedSessions: 0,
    averageScore: 0,
    lastSession: null as Date | null,
    strongAreas: [] as string[],
    weakAreas: [] as string[],
    questionsAttempted: 0,
    questionsCorrect: 0,
    currentStreak: 0,
    bestStreak: 0
  });

  // UI state
  showQuizSelection = signal(true);
  showPracticeSession = signal(false);
  showResults = signal(false);
  isLoading = signal(false);
  
  // Timer
  sessionStartTime = signal<Date | null>(null);
  currentTimer = signal(0);
  
  // Computed properties
  hasValidatedQuizzes = computed(() => this.availableQuizzes().length > 0);
  currentProgress = computed(() => {
    const total = this.practiceQuestions().length;
    const current = this.currentQuestionIndex() + 1;
    return total > 0 ? (current / total) * 100 : 0;
  });
  
  successRate = computed(() => {
    const stats = this.practiceStats();
    return stats.questionsAttempted > 0 
      ? Math.round((stats.questionsCorrect / stats.questionsAttempted) * 100)
      : 0;
  });

  ngOnInit() {
    this.loadPracticeData();
    this.quizService.fetchQuizzes();
  }

  private loadPracticeData() {
    // Load practice statistics from localStorage
    const savedStats = localStorage.getItem('practiceStats');
    if (savedStats) {
      this.practiceStats.set(JSON.parse(savedStats));
    }
  }

  private savePracticeData() {
    localStorage.setItem('practiceStats', JSON.stringify(this.practiceStats()));
  }

  // Select a quiz for practice
  selectQuiz(quiz: Quiz) {
    this.isLoading.set(true);
    
    // Fetch the complete quiz with questions
    this.quizService.fetchFullQuizById(quiz._id!).subscribe({
      next: (fullQuiz) => {
        this.selectedQuiz.set(fullQuiz);
        
        // Check if quiz has questions
        if (!fullQuiz.questions || fullQuiz.questions.length === 0) {
          console.error('Selected quiz has no questions:', fullQuiz);
          this.isLoading.set(false);
          // Could show an error message to user
          return;
        }
        
        this.practiceQuestions.set([...fullQuiz.questions]);
        this.currentQuestionIndex.set(0);
        this.currentQuestion.set(fullQuiz.questions[0]);
        this.userAnswers.set({});
        this.sessionResults.set(null);
        
        // Start practice session
        this.showQuizSelection.set(false);
        this.showPracticeSession.set(true);
        this.showResults.set(false);
        this.sessionStartTime.set(new Date());
        this.isLoading.set(false);
        this.startTimer();
      },
      error: (error) => {
        console.error('Error loading full quiz:', error);
        this.isLoading.set(false);
        // Could show error message to user
      }
    });
  }

  // Start timer for practice session
  private startTimer() {
    const startTime = this.sessionStartTime();
    if (startTime) {
      const timer = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        this.currentTimer.set(elapsed);
      }, 1000);
      
      // Store timer reference to clear it later
      (this as any)._timer = timer;
    }
  }

  private stopTimer() {
    if ((this as any)._timer) {
      clearInterval((this as any)._timer);
      (this as any)._timer = null;
    }
  }

  // Answer handlers
  selectAnswer(answer: any) {
    const currentQ = this.currentQuestion();
    if (currentQ) {
      this.userAnswers.update(answers => ({
        ...answers,
        [currentQ.id]: answer
      }));
    }
  }

  // For QCM questions
  selectQCMAnswer(answerId: string) {
    this.selectAnswer(answerId);
  }

  // For fill-in-the-blank questions
  updateFillAnswer(answer: string) {
    this.selectAnswer(answer);
  }

  // For coding questions
  updateCodingAnswer(code: string) {
    this.selectAnswer(code);
  }

  // Navigation
  nextQuestion() {
    const currentIndex = this.currentQuestionIndex();
    const questions = this.practiceQuestions();
    
    if (currentIndex < questions.length - 1) {
      this.currentQuestionIndex.set(currentIndex + 1);
      this.currentQuestion.set(questions[currentIndex + 1]);
    } else {
      this.finishPractice();
    }
  }

  previousQuestion() {
    const currentIndex = this.currentQuestionIndex();
    if (currentIndex > 0) {
      this.currentQuestionIndex.set(currentIndex - 1);
      this.currentQuestion.set(this.practiceQuestions()[currentIndex - 1]);
    }
  }

  // Finish practice session
  finishPractice() {
    this.stopTimer();
    
    const questions = this.practiceQuestions();
    const answers = this.userAnswers();
    const sessionStart = this.sessionStartTime();
    
    if (!sessionStart) return;
    
    const timeSpent = Math.floor((new Date().getTime() - sessionStart.getTime()) / 1000);
    let correctAnswers = 0;
    const detailedAnswers: any[] = [];
    
    questions.forEach(question => {
      const userAnswer = answers[question.id];
      let isCorrect = false;
      
      console.log(`Evaluating question ${question.id}:`, {
        type: question.type,
        userAnswer,
        question
      });
      
      if (question.type === 'qcm') {
        const correctAnswer = question.answers?.find(a => a.isCorrect);
        isCorrect = userAnswer === correctAnswer?.id;
        console.log(`QCM - Expected: ${correctAnswer?.id}, Got: ${userAnswer}, Correct: ${isCorrect}`);
      } else if (question.type === 'fill-in-the-blank') {
        const expectedAnswer = question.expectedAnswer?.toLowerCase().trim();
        const userAnswerNormalized = userAnswer?.toLowerCase().trim();
        isCorrect = userAnswerNormalized === expectedAnswer;
        console.log(`Fill - Expected: "${expectedAnswer}", Got: "${userAnswerNormalized}", Correct: ${isCorrect}`);
      } else if (question.type === 'coding') {
        // For coding questions, check if there's meaningful code
        isCorrect = userAnswer && userAnswer.trim().length > 20 && 
                   (userAnswer.includes('function') || userAnswer.includes('def') || 
                    userAnswer.includes('class') || userAnswer.includes('if') ||
                    userAnswer.includes('for') || userAnswer.includes('while'));
        console.log(`Coding - Length: ${userAnswer?.length}, Has keywords: ${isCorrect}`);
      }
      
      if (isCorrect) correctAnswers++;
      
      detailedAnswers.push({
        question,
        userAnswer,
        isCorrect
      });
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    
    const results = {
      score,
      correctAnswers,
      totalQuestions: questions.length,
      timeSpent,
      answers: detailedAnswers
    };
    
    this.sessionResults.set(results);
    
    // Update statistics
    this.updateStatistics(results);
    
    // Show results
    this.showPracticeSession.set(false);
    this.showResults.set(true);
  }

  private updateStatistics(results: SessionResults) {
    const stats = this.practiceStats();
    
    // Update streak
    let newStreak = results.score >= 70 ? stats.currentStreak + 1 : 0;
    let bestStreak = Math.max(stats.bestStreak, newStreak);
    
    // Update other stats
    const newStats = {
      ...stats,
      totalQuestions: stats.totalQuestions + results.totalQuestions,
      completedSessions: stats.completedSessions + 1,
      questionsAttempted: stats.questionsAttempted + results.totalQuestions,
      questionsCorrect: stats.questionsCorrect + results.correctAnswers,
      currentStreak: newStreak,
      bestStreak: bestStreak,
      lastSession: new Date(),
      averageScore: Math.round(((stats.averageScore * stats.completedSessions) + results.score) / (stats.completedSessions + 1))
    };
    
    this.practiceStats.set(newStats);
    this.savePracticeData();
  }

  // Reset and start new practice
  startNewPractice() {
    this.selectedQuiz.set(null);
    this.currentQuestion.set(null);
    this.currentQuestionIndex.set(0);
    this.practiceQuestions.set([]);
    this.userAnswers.set({});
    this.sessionResults.set(null);
    this.sessionStartTime.set(null);
    this.currentTimer.set(0);
    
    this.showQuizSelection.set(true);
    this.showPracticeSession.set(false);
    this.showResults.set(false);
    
    this.stopTimer();
  }

  // Utility methods
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  getDifficultyColor(difficulty: string | undefined): string {
    switch (difficulty) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'secondary';
    }
  }

  getDifficultyIcon(difficulty: string | undefined): string {
    switch (difficulty) {
      case 'easy': return 'fas fa-leaf';
      case 'medium': return 'fas fa-fire';
      case 'hard': return 'fas fa-skull';
      default: return 'fas fa-question';
    }
  }
}
