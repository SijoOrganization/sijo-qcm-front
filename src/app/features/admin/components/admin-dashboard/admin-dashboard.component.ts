import { Component, signal, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { QuizService } from '../../../quiz/services/quiz.service';
import { QuestionBankService } from '../../../quiz/services/question-bank.service';
import { CandidateService, Candidate, TestResult } from '../../services/candidate.service';
import { Quiz, Question } from '../../../../shared/models/quiz.model';
import { QuestionFormComponent } from '../question-form/question-form.component';
import { QuizPreviewModalComponent } from '../quiz-preview-modal/quiz-preview-modal.component';
import { AiQuizGeneratorComponent } from '../ai-quiz-generator/ai-quiz-generator.component';
import { ManualQuizCreatorComponent } from '../manual-quiz-creator/manual-quiz-creator.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, RouterModule, QuestionFormComponent, QuizPreviewModalComponent, AiQuizGeneratorComponent, ManualQuizCreatorComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css',
  standalone: true
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private quizService = inject(QuizService);
  private questionBankService = inject(QuestionBankService);
  private candidateService = inject(CandidateService);
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
    manuallyCreatedQuizzes: 0,
    totalCandidates: 0,
    beginnerCandidates: 0,
    intermediateCandidates: 0,
    advancedCandidates: 0,
    testsThisMonth: 0,
    averageScore: 0,
    completionRate: 0
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
  currentTab = signal<'dashboard' | 'ai-generator' | 'manual-creator' | 'validation' | 'candidates' | 'analytics'>('dashboard');
  showQuizForm = signal(false);
  showQuestionForm = signal(false);
  editingQuestion = signal<Question | null>(null);
  editingQuiz = signal<Quiz | null>(null); // Add this for quiz editing
  
  // Candidates Management
  allCandidates = signal<Candidate[]>([]);
  pendingCandidates = signal<Candidate[]>([]);
  completedCandidates = signal<Candidate[]>([]);
  testResults = signal<TestResult[]>([]);
  candidateStats = signal({
    totalCandidates: 0,
    completedTests: 0,
    averageScore: 0,
    topPerformers: [] as TestResult[],
    recentResults: [] as TestResult[]
  });
  isLoading = signal(false);
  
  // Quiz Preview Modal
  showQuizPreview = signal<boolean>(false);
  previewingQuiz = signal<Quiz | null>(null);

  ngOnInit() {
    if (!this.authService.hasTutorAccess()) {
      this.router.navigate(['/']);
      return;
    }
    this.loadData();
    
    // Auto-refresh data every 30 seconds if on validation tab
    setInterval(() => {
      if (this.currentTab() === 'validation') {
        this.refreshQuizData();
      }
    }, 30000);
  }

  private loadData() {
    this.isLoading.set(true);
    
    // Load quizzes using admin endpoints that include questions
    this.quizService.fetchAllQuizzesForAdmin().subscribe({
      next: (quizzes) => {
        console.log('Admin quizzes loaded:', quizzes.length);
        console.log('Quiz details:');
        quizzes.forEach(quiz => {
          console.log(`- Quiz "${quiz.title}": ${quiz.questions?.length || 0} questions`);
        });
        
        this.allQuizzes.set(quizzes);
        this.updateQuizLists();
        this.updateStats();
      },
      error: (error) => {
        console.error('Error loading admin quizzes:', error);
        this.allQuizzes.set([]);
        this.updateQuizLists();
        this.updateStats();
      }
    });

    // Load questions
    this.questionBankService.getRandomQuestions(1000).subscribe({
      next: (questions) => {
        console.log('Questions loaded:', questions.length);
        this.allQuestions.set(questions);
        this.updateQuestionLists();
        this.updateStats();
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.allQuestions.set([]);
        this.updateQuestionLists();
        this.updateStats();
      }
    });

    // Load candidates data
    this.loadCandidatesData();

    this.isLoading.set(false);
  }

  private updateQuestionLists() {
    const questions = this.allQuestions();
    const validatedQuestions = questions.filter(q => q.validity);
    const pendingQuestions = questions.filter(q => !q.validity);
    
    this.validatedQuestions.set(validatedQuestions);
    this.pendingQuestions.set(pendingQuestions);
  }

  private updateQuizLists() {
    const quizzes = this.allQuizzes();
    
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
    const candidates = this.allCandidates();
    
    this.stats.set({
      totalQuizzes: quizzes.length,
      validatedQuizzes: quizzes.filter(q => q.isValidated).length,
      pendingQuizzes: quizzes.filter(q => !q.isValidated).length,
      totalQuestions: questions.length,
      validatedQuestions: questions.filter(q => q.validity).length,
      pendingQuestions: questions.filter(q => !q.validity).length,
      aiGeneratedQuizzes: quizzes.filter(q => q.title.includes('AI') || (q._id && q._id.includes('ai'))).length,
      manuallyCreatedQuizzes: quizzes.filter(q => !q.title.includes('AI') && (!q._id || !q._id.includes('ai'))).length,
      totalCandidates: candidates.length,
      beginnerCandidates: candidates.filter(c => c.skillLevel === 'beginner').length,
      intermediateCandidates: candidates.filter(c => c.skillLevel === 'intermediate').length,
      advancedCandidates: candidates.filter(c => c.skillLevel === 'advanced').length,
      testsThisMonth: 45, // Mock data
      averageScore: this.getAverageScore(),
      completionRate: this.getCompletionRate()
    });
  }

  switchTab(tab: 'dashboard' | 'ai-generator' | 'manual-creator' | 'validation' | 'candidates' | 'analytics') {
    this.currentTab.set(tab);
    
    // Refresh data when switching to validation tab to show newly generated quizzes
    if (tab === 'validation') {
      this.refreshQuizData();
    }
  }
  
  // Method to refresh only quiz data without full reload
  refreshQuizData() {
    console.log('🔄 Refreshing quiz data...');
    this.quizService.fetchAllQuizzesForAdmin().subscribe({
      next: (quizzes) => {
        console.log('📊 Quiz data refreshed:', quizzes.length, 'quizzes');
        this.allQuizzes.set(quizzes);
        this.updateQuizLists();
        this.updateStats();
      },
      error: (error) => {
        console.error('Error refreshing quiz data:', error);
      }
    });
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
    console.log('Opening quiz preview for:', quiz.title);
    this.previewingQuiz.set(quiz);
    this.showQuizPreview.set(true);
  }

  closeQuizPreview() {
    this.showQuizPreview.set(false);
    this.previewingQuiz.set(null);
  }

  onQuizValidated(quiz: Quiz) {
    this.closeQuizPreview();
    this.validateQuiz(quiz);
  }

  onQuizEditRequested(quiz: Quiz) {
    this.closeQuizPreview();
    this.editQuiz(quiz);
  }

  editQuiz(quiz: Quiz) {
    // Set the quiz to edit and switch to manual creator tab
    this.editingQuiz.set(quiz);
    this.currentTab.set('manual-creator');
    // Close any open modals
    this.closeQuizPreview();
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

  // Candidates Management Methods
  loadCandidatesData() {
    // Charger tous les candidats
    this.candidateService.getAllCandidates().subscribe({
      next: (candidates) => {
        this.allCandidates.set(candidates);
        this.pendingCandidates.set(candidates.filter(c => c.testStatus === 'not_started' || c.testStatus === 'in_progress'));
        this.completedCandidates.set(candidates.filter(c => c.testStatus === 'completed'));
      },
      error: (error) => console.error('Error loading candidates:', error)
    });

    // Charger les statistiques de recrutement
    this.candidateService.getRecruitmentStats().subscribe({
      next: (stats) => {
        this.candidateStats.set(stats);
      },
      error: (error) => console.error('Error loading candidate stats:', error)
    });

    // Charger tous les résultats de tests
    this.candidateService.getAllTestResults().subscribe({
      next: (results) => {
        this.testResults.set(results);
      },
      error: (error) => console.error('Error loading test results:', error)
    });
  }

  openCandidateForm() {
    // TODO: Implémenter le formulaire de création de candidat
    console.log('Opening candidate form');
  }

  viewCandidateDetails(candidate: Candidate) {
    // TODO: Implémenter la vue détaillée du candidat
    console.log('Viewing candidate details:', candidate);
  }

  assignQuizToCandidate(candidate: Candidate) {
    // Obtenir le quiz suggéré pour ce candidat
    this.candidateService.getSuggestedQuizForCandidate(candidate._id!).subscribe({
      next: (suggestedQuiz) => {
        if (confirm(`Assigner le quiz "${suggestedQuiz.title}" à ${candidate.firstName} ${candidate.lastName}?`)) {
          this.candidateService.assignQuizToCandidate(candidate._id!, suggestedQuiz._id).subscribe({
            next: (updatedCandidate) => {
              console.log('Quiz assigned successfully');
              this.loadCandidatesData(); // Recharger les données
            },
            error: (error) => {
              console.error('Error assigning quiz:', error);
              alert('Erreur lors de l\'assignation du quiz');
            }
          });
        }
      },
      error: (error) => {
        console.error('Error getting suggested quiz:', error);
        alert('Aucun quiz approprié trouvé pour ce candidat');
      }
    });
  }

  editCandidate(candidate: Candidate) {
    // TODO: Implémenter l'édition du candidat
    console.log('Editing candidate:', candidate);
  }

  deleteCandidate(candidate: Candidate) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le candidat ${candidate.firstName} ${candidate.lastName}?`)) {
      this.candidateService.deleteCandidate(candidate._id!).subscribe({
        next: () => {
          console.log('Candidate deleted successfully');
          this.loadCandidatesData(); // Recharger les données
        },
        error: (error) => {
          console.error('Error deleting candidate:', error);
          alert('Erreur lors de la suppression du candidat');
        }
      });
    }
  }

  // Utility methods for candidates
  getTestStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'not_started': 'Non démarré',
      'in_progress': 'En cours',
      'completed': 'Complété',
      'expired': 'Expiré'
    };
    return labels[status] || status;
  }

  getGradeColor(grade: string): string {
    const colors: { [key: string]: string } = {
      'A': 'success',
      'B': 'primary',
      'C': 'warning',
      'D': 'danger',
      'F': 'danger'
    };
    return colors[grade] || 'secondary';
  }

  getRecommendationColor(recommendation: string): string {
    const colors: { [key: string]: string } = {
      'strongly_recommend': 'success',
      'recommend': 'primary',
      'conditional': 'warning',
      'not_recommend': 'danger'
    };
    return colors[recommendation] || 'secondary';
  }

  getRecommendationLabel(recommendation: string): string {
    const labels: { [key: string]: string } = {
      'highly_recommended': 'Highly Recommended',
      'recommended': 'Recommended', 
      'not_recommended': 'Not Recommended',
      'needs_improvement': 'Needs Improvement'
    };
    return labels[recommendation] || recommendation;
  }

  // New methods for enhanced candidate management
  getCandidatesByLevel(level: string): Candidate[] {
    return this.allCandidates().filter(candidate => candidate.skillLevel === level);
  }

  hasValidatedQuizzesForLevel(level: string): boolean {
    return this.validatedQuizzes().some(quiz => 
      quiz.difficulty === level || 
      (level === 'beginner' && quiz.difficulty === 'easy') ||
      (level === 'intermediate' && quiz.difficulty === 'medium') ||
      (level === 'advanced' && quiz.difficulty === 'hard')
    );
  }

  assignSmartQuiz(candidate: Candidate) {
    // Smart assignment based on candidate level and available quizzes
    const appropriateQuizzes = this.validatedQuizzes().filter(quiz => {
      if (candidate.skillLevel === 'beginner') return quiz.difficulty === 'easy';
      if (candidate.skillLevel === 'intermediate') return quiz.difficulty === 'medium';
      if (candidate.skillLevel === 'advanced') return quiz.difficulty === 'hard';
      return false;
    });

    if (appropriateQuizzes.length === 0) {
      alert(`No appropriate quizzes available for ${candidate.skillLevel} level. Please create and validate quizzes for this level first.`);
      return;
    }

    // Select the most suitable quiz (you can implement more sophisticated logic here)
    const selectedQuiz = appropriateQuizzes[0];
    
    if (confirm(`Assign "${selectedQuiz.title}" (${selectedQuiz.difficulty}) to ${candidate.firstName} ${candidate.lastName}?`)) {
      this.candidateService.assignQuizToCandidate(candidate._id!, selectedQuiz._id!).subscribe({
        next: () => {
          console.log('Quiz assigned successfully');
          this.loadCandidatesData();
        },
        error: (error) => {
          console.error('Error assigning quiz:', error);
          alert('Error assigning quiz');
        }
      });
    }
  }

  viewDetailedResults(result: TestResult) {
    // Navigate to detailed results view
    console.log('Viewing detailed results for:', result);
    // You can implement a detailed results modal or navigate to a results page
  }

  // Analytics methods
  getAverageCompletionTime(): number {
    const results = this.candidateStats().recentResults;
    if (results.length === 0) return 0;
    
    const totalTime = results.reduce((sum, result) => sum + (result.actualDurationMinutes || 0), 0);
    return Math.round(totalTime / results.length);
  }

  getHiringRecommendationRate(): number {
    const results = this.candidateStats().recentResults;
    if (results.length === 0) return 0;
    
    const recommendedCount = results.filter(result => 
      result.hiringRecommendation === 'strongly_recommend' || 
      result.hiringRecommendation === 'recommend'
    ).length;
    
    return Math.round((recommendedCount / results.length) * 100);
  }

  getQuizStatistics(): any[] {
    // Mock data for quiz statistics - replace with real data from your service
    return [
      {
        title: 'JavaScript Fundamentals',
        timesTaken: 25,
        averageScore: 78.5,
        passRate: 72.0,
        averageDuration: 28
      },
      {
        title: 'Python Basics',
        timesTaken: 18,
        averageScore: 82.3,
        passRate: 83.3,
        averageDuration: 32
      },
      {
        title: 'React Components',
        timesTaken: 12,
        averageScore: 75.8,
        passRate: 66.7,
        averageDuration: 35
      }
    ];
  }

  getCompletionRate(): number {
    const totalTests = 150; // Mock data
    const completedTests = 120; // Mock data
    return Math.round((completedTests / totalTests) * 100);
  }

  getAverageScore(): number {
    return 76.5; // Mock data
  }

  getTopPerformingQuizzes(): string[] {
    return ['JavaScript Fundamentals', 'Python Basics', 'React Components']; // Mock data
  }

  getPoorPerformingQuizzes(): string[] {
    return ['Advanced Algorithms', 'System Design', 'Database Optimization']; // Mock data
  }

  getCandidateGrowthRate(): number {
    return 23; // Mock data - percentage growth
  }

  // Manual Quiz Creation Methods
  onManualQuizCreated(quizData: any) {
    console.log('Manual quiz created/updated:', quizData);
    
    // Transform the manual quiz data to match the expected Quiz interface
    const quiz: Partial<Quiz> = {
      title: quizData.title,
      explanation: quizData.explanation,
      category: quizData.category,
      difficulty: quizData.difficulty,
      language: quizData.language,
      estimatedTime: quizData.estimatedTime,
      questions: quizData.questions.map((q: any) => ({
        id: q.id,
        type: q.type,
        text: q.text,
        answers: q.answers,
        expectedAnswer: q.expectedAnswer,
        code: q.code,
        language: q.language,
        difficulty: q.difficulty,
        validity: q.validity,
        testCases: q.testCases
      })),
      isValidated: false, // Manual quizzes need validation too
      createdAt: new Date()
    };

    // Check if we're updating an existing quiz
    if (quizData.isUpdate && quizData._id) {
      quiz._id = quizData._id;
      
      // Update existing quiz
      this.quizService.updateQuiz(quiz as Quiz).subscribe({
        next: (updatedQuiz) => {
          console.log('Quiz updated successfully:', updatedQuiz);
          alert(`Quiz "${quizData.title}" updated successfully!`);
          
          // Reset editing state
          this.editingQuiz.set(null);
          
          // Refresh the quiz lists
          this.loadData();
          
          // Switch to validation tab to see the updated quiz
          this.currentTab.set('validation');
        },
        error: (error) => {
          console.error('Error updating quiz:', error);
          alert('Error updating quiz. Please try again.');
        }
      });
    } else {
      // Create new quiz
      this.quizService.createQuiz(quiz as Quiz).subscribe({
        next: (savedQuiz) => {
          console.log('Manual quiz saved successfully:', savedQuiz);
          alert(`Quiz "${quizData.title}" created successfully! It will appear in the validation center for review.`);
          
          // Refresh the quiz lists
          this.loadData();
          
          // Switch to validation tab to see the newly created quiz
          this.currentTab.set('validation');
        },
        error: (error) => {
          console.error('Error saving manual quiz:', error);
          alert('Error creating quiz. Please try again.');
        }
      });
    }
  }

  onManualQuizCancelled() {
    console.log('Manual quiz creation cancelled');
    // Reset the editing quiz and switch back to dashboard
    this.editingQuiz.set(null);
    this.currentTab.set('dashboard');
  }
  
  // Handle AI quiz generation completion
  onAIQuizGenerated(quiz: any) {
    console.log('🤖 AI Quiz generated, refreshing dashboard data...', quiz);
    // Refresh quiz data to show the new quiz
    this.refreshQuizData();
    // Switch to validation tab to show the new quiz
    setTimeout(() => {
      this.currentTab.set('validation');
    }, 1000);
  }

  // Enhanced Statistics Calculations
  private updateEnhancedStats() {
    const candidates = this.allCandidates();
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
      manuallyCreatedQuizzes: quizzes.filter(q => !q.title.includes('AI') && (!q._id || !q._id.includes('ai'))).length,
      totalCandidates: candidates.length,
      beginnerCandidates: candidates.filter(c => c.skillLevel === 'beginner').length,
      intermediateCandidates: candidates.filter(c => c.skillLevel === 'intermediate').length,
      advancedCandidates: candidates.filter(c => c.skillLevel === 'advanced').length,
      testsThisMonth: 45, // Mock data
      averageScore: this.getAverageScore(),
      completionRate: this.getCompletionRate()
    });
  }
}
