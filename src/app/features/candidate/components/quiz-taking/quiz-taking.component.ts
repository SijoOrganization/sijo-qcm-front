import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { CandidateQuizService } from '../../services/candidate-quiz.service';
import { AlertService } from '../../../../core/alert/services/alert.service';

interface QuizSession {
  sessionId: string;
  quizTitle: string;
  totalQuestions: number;
  durationMinutes: number;
  remainingTimeSeconds: number;
  status: string;
}

interface Question {
  id: string;
  text: string;
  type: string;
  answers?: Answer[];
  expectedAnswer?: string;
  functionName?: string;
  testCases?: TestCase[];
  functionSignatures?: FunctionSignature[];
}

interface Answer {
  id: string;
  option: string;
  isCorrect?: boolean;
}

interface TestCase {
  input: string;
  expectedOutput: string;
}

interface FunctionSignature {
  language: string;
  arguments: Array<{name: string, type: string}>;
  returnType: string;
}

@Component({
  selector: 'app-quiz-taking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './quiz-taking.component.html',
  styleUrl: './quiz-taking.component.css'
})
export class QuizTakingComponent implements OnInit, OnDestroy {

  // État du quiz
  session: QuizSession | null = null;
  currentQuestion: Question | null = null;
  currentQuestionIndex = 0;
  totalQuestions = 0;
  
  // Timer
  remainingTimeSeconds = 0;
  displayTime = '';
  timerSubscription?: Subscription;
  
  // Réponses
  selectedAnswerId = '';
  codeSubmission = '';
  textAnswer = '';
  
  // États
  isLoading = true;
  isSubmitting = false;
  isPaused = false;
  questionsMarkedForReview: string[] = [];
  
  // Navigation
  answeredQuestions = new Set<number>();
  
  private sessionId = '';
  private autoSaveSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private quizService: CandidateQuizService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.params['sessionId'];
    if (!this.sessionId) {
      this.alertService.setMessage({
        type: 'error',
        message: 'Session invalide'
      });
      this.router.navigate(['/']);
      return;
    }
    
    this.initializeQuiz();
    this.startAutoSave();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stopAutoSave();
  }

  // Détecter les tentatives de quitter la page
  @HostListener('beforeunload', ['$event'])
  onBeforeUnload(event: any): void {
    this.autoSaveCurrentAnswer();
    event.returnValue = 'Êtes-vous sûr de vouloir quitter le test ? Votre progression sera sauvegardée.';
  }

  // Détecter le changement d'onglet
  @HostListener('document:visibilitychange', ['$event'])
  onVisibilityChange(): void {
    if (document.hidden) {
      this.reportSuspiciousActivity('TAB_SWITCH');
    }
  }

  // Détecter les gros collages
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') || '';
    if (pastedText.length > 100) {
      this.reportSuspiciousActivity('LARGE_PASTE');
    }
  }

  private async initializeQuiz(): Promise<void> {
    try {
      // Récupérer le statut de la session
      const status = await this.quizService.getSessionStatus(this.sessionId).toPromise();
      
      if (status) {
        this.currentQuestionIndex = status.currentQuestionIndex;
        this.totalQuestions = status.totalQuestions;
        this.remainingTimeSeconds = status.remainingTimeSeconds;
      }
      
      // Charger la question courante
      await this.loadCurrentQuestion();
      
      // Démarrer le timer
      this.startTimer();
      
      this.isLoading = false;
      
    } catch (error) {
      console.error('Erreur initialisation quiz:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur lors du chargement du quiz'
      });
      this.router.navigate(['/']);
    }
  }

  private async loadCurrentQuestion(): Promise<void> {
    try {
      // TODO: Implémenter l'API pour récupérer une question spécifique
      // Pour l'instant, on simule
      this.currentQuestion = {
        id: `q${this.currentQuestionIndex + 1}`,
        text: `Question ${this.currentQuestionIndex + 1} - Ceci est une question de test`,
        type: 'qcm',
        answers: [
          { id: 'a1', option: 'Option A' },
          { id: 'a2', option: 'Option B' },
          { id: 'a3', option: 'Option C' },
          { id: 'a4', option: 'Option D' }
        ]
      };
      
      // Charger la réponse précédente si elle existe
      this.loadPreviousAnswer();
      
    } catch (error) {
      console.error('Erreur chargement question:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur lors du chargement de la question'
      });
    }
  }

  private loadPreviousAnswer(): void {
    // Réinitialiser les réponses
    this.selectedAnswerId = '';
    this.codeSubmission = '';
    this.textAnswer = '';
    
    // TODO: Charger la réponse précédente depuis le backend
  }

  private startTimer(): void {
    this.updateDisplayTime();
    
    this.timerSubscription = interval(1000).subscribe(() => {
      if (this.remainingTimeSeconds > 0 && !this.isPaused) {
        this.remainingTimeSeconds--;
        this.updateDisplayTime();
      } else if (this.remainingTimeSeconds <= 0) {
        this.finishQuiz(true); // Auto-finish à l'expiration
      }
    });
  }

  private stopTimer(): void {
    this.timerSubscription?.unsubscribe();
  }

  private updateDisplayTime(): void {
    const hours = Math.floor(this.remainingTimeSeconds / 3600);
    const minutes = Math.floor((this.remainingTimeSeconds % 3600) / 60);
    const seconds = this.remainingTimeSeconds % 60;
    
    if (hours > 0) {
      this.displayTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      this.displayTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }

  private startAutoSave(): void {
    // Sauvegarde automatique toutes les 30 secondes
    this.autoSaveSubscription = interval(30000).subscribe(() => {
      this.autoSaveCurrentAnswer();
    });
  }

  private stopAutoSave(): void {
    this.autoSaveSubscription?.unsubscribe();
  }

  private autoSaveCurrentAnswer(): void {
    if (this.hasAnswer()) {
      this.submitCurrentAnswer(false); // false = pas de navigation
    }
  }

  hasAnswer(): boolean {
    if (!this.currentQuestion) return false;
    
    switch (this.currentQuestion.type) {
      case 'qcm':
        return !!this.selectedAnswerId;
      case 'coding':
        return !!this.codeSubmission.trim();
      case 'fill-in-the-blank':
        return !!this.textAnswer.trim();
      default:
        return false;
    }
  }

  async submitCurrentAnswer(navigateNext = true): Promise<void> {
    if (!this.currentQuestion || !this.hasAnswer()) {
      if (navigateNext) {
        this.navigateToQuestion(this.currentQuestionIndex + 1);
      }
      return;
    }

    this.isSubmitting = true;

    try {
      const answerData = {
        questionId: this.currentQuestion.id,
        questionType: this.currentQuestion.type,
        selectedOptionId: this.selectedAnswerId,
        codeSubmission: this.codeSubmission,
        programmingLanguage: 'javascript', // TODO: Récupérer du contexte
        textAnswer: this.textAnswer,
        timeSpentSeconds: 60 // TODO: Calculer le temps réel
      };

      await this.quizService.submitAnswer(this.sessionId, answerData).toPromise();
      
      // Marquer comme répondu
      this.answeredQuestions.add(this.currentQuestionIndex);
      
      if (navigateNext) {
        if (this.currentQuestionIndex < this.totalQuestions - 1) {
          this.navigateToQuestion(this.currentQuestionIndex + 1);
        } else {
          // Dernière question
          this.alertService.setMessage({
            type: 'success',
            message: 'Dernière question ! Vous pouvez maintenant terminer le quiz.'
          });
        }
      }

    } catch (error) {
      console.error('Erreur soumission réponse:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur lors de la sauvegarde'
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  async navigateToQuestion(index: number): Promise<void> {
    if (index < 0 || index >= this.totalQuestions) return;

    try {
      await this.quizService.navigateToQuestion(this.sessionId, index).toPromise();
      this.currentQuestionIndex = index;
      await this.loadCurrentQuestion();
    } catch (error) {
      console.error('Erreur navigation:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur lors de la navigation'
      });
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex > 0) {
      this.navigateToQuestion(this.currentQuestionIndex - 1);
    }
  }

  nextQuestion(): void {
    this.submitCurrentAnswer(true);
  }

  async markForReview(): Promise<void> {
    if (!this.currentQuestion) return;

    try {
      await this.quizService.markForReview(this.sessionId, this.currentQuestion.id).toPromise();
      
      if (!this.questionsMarkedForReview.includes(this.currentQuestion.id)) {
        this.questionsMarkedForReview.push(this.currentQuestion.id);
        this.alertService.setMessage({
          type: 'success',
          message: 'Question marquée pour révision'
        });
      }
    } catch (error) {
      console.error('Erreur marquage révision:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur lors du marquage'
      });
    }
  }

  isQuestionMarkedForReview(): boolean {
    return this.currentQuestion ? 
      this.questionsMarkedForReview.includes(this.currentQuestion.id) : false;
  }

  async pauseQuiz(): Promise<void> {
    try {
      await this.quizService.pauseSession(this.sessionId).toPromise();
      this.isPaused = true;
      this.alertService.setMessage({
        type: 'info',
        message: 'Quiz mis en pause'
      });
    } catch (error) {
      console.error('Erreur pause:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur lors de la pause'
      });
    }
  }

  async resumeQuiz(): Promise<void> {
    try {
      await this.quizService.resumeSession(this.sessionId).toPromise();
      this.isPaused = false;
      this.alertService.setMessage({
        type: 'success',
        message: 'Quiz repris'
      });
    } catch (error) {
      console.error('Erreur reprise:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur lors de la reprise'
      });
    }
  }

  async finishQuiz(autoFinish = false): Promise<void> {
    const confirmMessage = autoFinish ? 
      'Le temps est écoulé. Le quiz va être automatiquement terminé.' :
      'Êtes-vous sûr de vouloir terminer le quiz ? Cette action est irréversible.';

    if (!autoFinish && !confirm(confirmMessage)) {
      return;
    }

    try {
      this.isSubmitting = true;
      
      // Sauvegarder la réponse courante si elle existe
      if (this.hasAnswer()) {
        await this.submitCurrentAnswer(false);
      }
      
      // Terminer le quiz
      const result = await this.quizService.finishQuiz(this.sessionId).toPromise();
      
      this.stopTimer();
      this.alertService.setMessage({
        type: 'success',
        message: 'Quiz terminé avec succès !'
      });
      
      // Rediriger vers les résultats
      this.router.navigate(['/candidate/results', this.sessionId]);

    } catch (error) {
      console.error('Erreur finalisation:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur lors de la finalisation'
      });
      this.isSubmitting = false;
    }
  }

  private async reportSuspiciousActivity(type: string): Promise<void> {
    try {
      await this.quizService.reportSuspiciousActivity(this.sessionId, type).toPromise();
    } catch (error) {
      console.error('Erreur signalement activité:', error);
    }
  }

  getProgressPercentage(): number {
    return this.totalQuestions > 0 ? 
      (this.answeredQuestions.size / this.totalQuestions) * 100 : 0;
  }

  getTimeColor(): string {
    const percentage = (this.remainingTimeSeconds / (this.session?.durationMinutes || 60) / 60) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'danger';
  }

  isAnswered(index: number): boolean {
    return this.answeredQuestions.has(index);
  }

  // Méthodes pour le template HTML
  getSignatureParams(sig: FunctionSignature): string {
    return sig.arguments.map(arg => `${arg.type} ${arg.name}`).join(', ');
  }
}
