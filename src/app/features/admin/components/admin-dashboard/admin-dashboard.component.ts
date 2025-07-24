import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { QuizService } from '../../../quiz/services/quiz.service';
import { QuestionBankService } from '../../../quiz/services/question-bank.service';
import { Quiz, Question } from '../../../../shared/models/quiz.model';
import { QuestionFormComponent } from '../question-form/question-form.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, RouterLink, RouterModule, QuestionFormComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  standalone: true
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private quizService = inject(QuizService);
  private questionBankService = inject(QuestionBankService);
  private router = inject(Router);

  // Dashboard Statistics
  stats = signal({
    totalQuizzes: 0,
    validatedQuizzes: 0,
    pendingQuizzes: 0,
    totalQuestions: 0,
    validatedQuestions: 0,
    pendingQuestions: 0,
    aiGeneratedQuizzes: 0,
    manuallyCreatedQuizzes: 0
  });

  // Quiz Management
  allQuizzes = signal<Quiz[]>([]);
  pendingQuizzes = signal<Quiz[]>([]);
  validatedQuizzes = signal<Quiz[]>([]);
  
  // Question Management
  allQuestions = signal<Question[]>([]);
  pendingQuestions = signal<Question[]>([]);
  validatedQuestions = signal<Question[]>([]);

  // UI States
  currentTab = signal<'dashboard' | 'quizzes' | 'questions' | 'settings'>('dashboard');
  showQuizForm = signal(false);
  showQuestionForm = signal(false);
  editingQuestion = signal<Question | null>(null);
  isLoading = signal(false);

  ngOnInit() {
    if (!this.authService.hasTutorAccess()) {
      this.router.navigate(['/']);
      return;
    }
    this.loadData();
  }

  private loadData() {
    this.isLoading.set(true);
    
    // Load quizzes
    this.quizService.fetchQuizzes().subscribe({
      next: (quizzes) => {
        this.allQuizzes.set(quizzes);
        this.updateQuizLists();
        this.updateStats();
      },
      error: (error) => {
        console.error('Error loading quizzes:', error);
        this.allQuizzes.set([]);
        this.updateQuizLists();
        this.updateStats();
      }
    });

    // Load questions
    this.questionBankService.getRandomQuestions(1000).subscribe({
      next: (questions) => {
        this.allQuestions.set(questions);
        const validatedQuestions = questions.filter(q => q.validity);
        const pendingQuestions = questions.filter(q => !q.validity);
        
        this.validatedQuestions.set(validatedQuestions);
        this.pendingQuestions.set(pendingQuestions);
        
        this.updateStats();
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.isLoading.set(false);
      }
    });
  }

  private updateQuizLists() {
    const quizzes = this.quizService.quizzes();
    this.allQuizzes.set(quizzes);
    
    // Separate validated and pending quizzes
    const validated = quizzes.filter(q => q.isValidated);
    const pending = quizzes.filter(q => !q.isValidated);
    
    this.validatedQuizzes.set(validated);
    this.pendingQuizzes.set(pending);
    
    this.updateStats();
  }

  private updateStats() {
    const quizzes = this.allQuizzes();
    const questions = this.allQuestions();
    
    this.stats.set({
      totalQuizzes: quizzes.length,
      validatedQuizzes: quizzes.filter(q => q.isValidated).length,
      pendingQuizzes: quizzes.filter(q => !q.isValidated).length,
      totalQuestions: questions.length,
      validatedQuestions: questions.filter(q => q.validity).length,
      pendingQuestions: questions.filter(q => !q.validity).length,
      aiGeneratedQuizzes: quizzes.filter(q => q.title.includes('AI') || (q._id && q._id.includes('ai'))).length,
      manuallyCreatedQuizzes: quizzes.filter(q => !q.title.includes('AI') && (!q._id || !q._id.includes('ai'))).length
    });
  }

  switchTab(tab: 'dashboard' | 'quizzes' | 'questions' | 'settings') {
    this.currentTab.set(tab);
  }

  // Quiz Management
  validateQuiz(quiz: Quiz) {
    this.quizService.validateQuiz(quiz._id!).subscribe({
      next: () => {
        // Refresh quiz lists
        this.quizService.fetchQuizzes().subscribe({
          next: (quizzes) => {
            this.allQuizzes.set(quizzes);
            this.updateQuizLists();
          }
        });
        alert('Quiz validated successfully!');
      },
      error: (error) => {
        console.error('Error validating quiz:', error);
        alert('Error validating quiz');
      }
    });
  }

  invalidateQuiz(quiz: Quiz) {
    this.quizService.invalidateQuiz(quiz._id!).subscribe({
      next: () => {
        // Refresh quiz lists
        this.quizService.fetchQuizzes().subscribe({
          next: (quizzes) => {
            this.allQuizzes.set(quizzes);
            this.updateQuizLists();
          }
        });
        alert('Quiz invalidated successfully!');
      },
      error: (error) => {
        console.error('Error invalidating quiz:', error);
        alert('Error invalidating quiz');
      }
    });
  }

  deleteQuiz(quiz: Quiz) {
    if (confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
      this.quizService.deleteQuiz(quiz._id!).subscribe({
        next: () => {
          // Refresh quiz lists
          this.quizService.fetchQuizzes();
          setTimeout(() => {
            this.updateQuizLists();
          }, 100);
          alert('Quiz deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting quiz:', error);
          alert('Error deleting quiz');
        }
      });
    }
  }

  // Question Management
  validateQuestion(question: Question) {
    this.questionBankService.validateQuestion(question.id, true).subscribe({
      next: () => {
        // Reload questions only
        this.questionBankService.getRandomQuestions(1000).subscribe(questions => {
          this.allQuestions.set(questions);
          const validatedQuestions = questions.filter(q => q.validity);
          const pendingQuestions = questions.filter(q => !q.validity);
          
          this.validatedQuestions.set(validatedQuestions);
          this.pendingQuestions.set(pendingQuestions);
          this.updateStats();
        });
        alert('Question validated successfully!');
      },
      error: (error) => {
        console.error('Error validating question:', error);
        alert('Error validating question');
      }
    });
  }

  deleteQuestion(question: Question) {
    if (confirm(`Are you sure you want to delete this question?`)) {
      this.questionBankService.deleteQuestion(question.id).subscribe({
        next: () => {
          // Reload questions only
          this.questionBankService.getRandomQuestions(1000).subscribe(questions => {
            this.allQuestions.set(questions);
            const validatedQuestions = questions.filter(q => q.validity);
            const pendingQuestions = questions.filter(q => !q.validity);
            
            this.validatedQuestions.set(validatedQuestions);
            this.pendingQuestions.set(pendingQuestions);
            this.updateStats();
          });
          alert('Question deleted successfully!');
        },
        error: (error) => {
          console.error('Error deleting question:', error);
          alert('Error deleting question');
        }
      });
    }
  }

  // Question Form Management
  openQuestionForm(question?: Question) {
    if (question) {
      this.editingQuestion.set(question);
    } else {
      this.editingQuestion.set(null);
    }
    this.showQuestionForm.set(true);
  }

  closeQuestionForm() {
    this.showQuestionForm.set(false);
    this.editingQuestion.set(null);
  }

  onQuestionSaved(question: Question) {
    // Reload questions only
    this.questionBankService.getRandomQuestions(1000).subscribe(questions => {
      this.allQuestions.set(questions);
      const validatedQuestions = questions.filter(q => q.validity);
      const pendingQuestions = questions.filter(q => !q.validity);
      
      this.validatedQuestions.set(validatedQuestions);
      this.pendingQuestions.set(pendingQuestions);
      this.updateStats();
    });
    this.closeQuestionForm();
  }

  // Quiz Actions
  previewQuiz(quiz: Quiz) {
    // Pour le moment, on affiche juste les détails du quiz
    const quizDetails = `
Titre: ${quiz.title}
Catégorie: ${quiz.category}
Difficulté: ${quiz.difficulty}
Durée estimée: ${quiz.estimatedTime} minutes
Nombre de questions: ${quiz.questions?.length || 0}
Status: ${quiz.isValidated ? 'Validé' : 'En attente'}
${quiz.validatedBy ? 'Validé par: ' + quiz.validatedBy : ''}

Questions:
${quiz.questions?.map((q, i) => `${i + 1}. ${q.text} (${q.type})`).join('\n') || 'Aucune question'}
    `;
    
    alert(quizDetails);
  }

  editQuiz(quiz: Quiz) {
    this.router.navigate(['/quizzes', quiz._id, 'edit']);
  }

  // Utility Methods
  getQuizTypeIcon(quiz: Quiz): string {
    if (quiz.title.includes('AI') || (quiz._id && quiz._id.includes('ai'))) {
      return 'fas fa-robot';
    }
    return 'fas fa-user-edit';
  }

  getStatusBadgeClass(isValid: boolean): string {
    return isValid ? 'badge bg-success' : 'badge bg-warning';
  }

  getStatusText(isValid: boolean): string {
    return isValid ? 'Validated' : 'Pending';
  }
}
