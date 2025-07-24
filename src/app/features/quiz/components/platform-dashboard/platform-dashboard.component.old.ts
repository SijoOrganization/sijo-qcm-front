import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { QuizService, AIQuizGenerationRequest } from '../../services/quiz.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Quiz } from '../../../../shared/models/quiz.model';

interface QuizFilters {
  difficulty: string;
  category: string;
  language: string;
  searchTerm: string;
  aiGenerated: boolean | null;
  validated: boolean | null;
}

@Component({
  selector: 'app-platform-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './platform-dashboard.component.html',
  styleUrl: './platform-dashboard.component.css'
})
export class PlatformDashboardComponent {
  private quizService = inject(QuizService);
  private authService = inject(AuthService);

  // Signals for reactive state
  activeTab = signal<string>('challenges');
  isLoading = signal<boolean>(false);
  
  // Filter signals
  filters = signal<QuizFilters>({
    difficulty: '',
    category: '',
    language: '',
    searchTerm: '',
    aiGenerated: null,
    validated: null
  });

  // AI Generator form
  aiGeneratorForm = signal({
    topics: '',
    numberOfQuestions: 5,
    difficulty: 'medium',
    language: 'Java',
    includeCode: true
  });

  isGenerating = signal<boolean>(false);

  // Computed properties
  quizzes = this.quizService.quizzes;
  
  filteredQuizzes = computed(() => {
    const currentFilters = this.filters();
    let filtered = this.quizzes() || [];

    // Apply filters
    if (currentFilters.difficulty) {
      filtered = filtered.filter(quiz => 
        quiz.difficulty?.toLowerCase() === currentFilters.difficulty.toLowerCase()
      );
    }

    if (currentFilters.category) {
      filtered = filtered.filter(quiz => 
        quiz.category?.toLowerCase().includes(currentFilters.category.toLowerCase())
      );
    }

    if (currentFilters.language) {
      filtered = filtered.filter(quiz => 
        quiz.category?.toLowerCase().includes(currentFilters.language.toLowerCase())
      );
    }

    if (currentFilters.searchTerm) {
      const term = currentFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(quiz => 
        quiz.title?.toLowerCase().includes(term) ||
        quiz.explanation?.toLowerCase().includes(term) ||
        quiz.category?.toLowerCase().includes(term)
      );
    }

    if (currentFilters.aiGenerated !== null) {
      filtered = filtered.filter(quiz => 
        Boolean((quiz as any).isAiGenerated) === currentFilters.aiGenerated
      );
    }

    if (currentFilters.validated !== null) {
      filtered = filtered.filter(quiz => 
        Boolean(quiz.isValidated) === currentFilters.validated
      );
    }

    return filtered;
  });

  // Computed properties pour les statistiques  
  validatedQuizCount = computed(() => 
    this.quizzes()?.filter(quiz => quiz.isValidated).length || 0
  );

  aiGeneratedCount = computed(() => 
    this.quizzes()?.filter(quiz => (quiz as any).isAiGenerated).length || 0
  );

  ngOnInit(): void {
    this.loadQuizzes();
  }

  private loadQuizzes(): void {
    this.isLoading.set(true);
    this.quizService.fetchQuizzes().subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading quizzes:', error);
        this.isLoading.set(false);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab.set(tab);
  }

  updateFilter<K extends keyof QuizFilters>(key: K, value: QuizFilters[K]): void {
    this.filters.update(current => ({
      ...current,
      [key]: value
    }));
  }

  clearFilters(): void {
    this.filters.set({
      difficulty: '',
      category: '',
      language: '',
      searchTerm: '',
      aiGenerated: null,
      validated: null
    });
  }

  getDifficultyClass(difficulty: string | undefined): string {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return 'difficulty-unknown';
    }
  }

  getCodingQuestionCount(quiz: Quiz | null | undefined): number {
    if (!quiz || !quiz.questions) return 0;
    return quiz.questions.filter((q: any) => q.type === 'coding').length || 0;
  }

  getEstimatedTime(quiz: Quiz | null | undefined): string {
    if (!quiz) return '0min';
    return quiz.estimatedTime ? `${quiz.estimatedTime}min` : '30min';
  }

  isAiGenerated(quiz: Quiz | null | undefined): boolean {
    if (!quiz) return false;
    return Boolean((quiz as any).isAiGenerated);
  }

  getQuizTags(quiz: Quiz | null | undefined): string[] {
    if (!quiz) return [];
    return (quiz as any).tags || [];
  }

  generateAIQuiz(): void {
    const form = this.aiGeneratorForm();
    this.isGenerating.set(true);

    const request = {
      topics: form.topics,
      numberOfQuestions: form.numberOfQuestions,
      difficulty: form.difficulty as 'easy' | 'medium' | 'hard' | 'mixed',
      language: form.language,
      includeCode: form.includeCode
    };

    this.quizService.generateAIQuiz(request).subscribe({
      next: (response) => {
        console.log('AI Quiz generated successfully:', response);
        this.isGenerating.set(false);
        // Switch to challenges tab to see the result
        this.setActiveTab('challenges');
        // Reset form
        this.aiGeneratorForm.update(form => ({
          ...form,
          topics: ''
        }));
      },
      error: (error) => {
        console.error('Error generating AI quiz:', error);
        this.isGenerating.set(false);
        // Show user-friendly error message
        alert('Failed to generate quiz. Please try again with different parameters.');
      }
    });
  }

  testAIGeneration(): void {
    console.log('Testing AI Quiz Generation...');
    
    const testRequest = {
      topics: 'JavaScript Basics',
      numberOfQuestions: 3,
      difficulty: 'easy' as const,
      language: 'JavaScript',
      includeCode: false
    };

    this.isGenerating.set(true);

    this.quizService.generateAIQuiz(testRequest).subscribe({
      next: (response) => {
        console.log('AI Quiz generated successfully:', response);
        this.isGenerating.set(false);
        alert(`AI Quiz "${response.quiz.title}" generated successfully and added to dashboard!`);
        
        // Refresh quiz list to show the new quiz
        this.loadQuizzes();
      },
      error: (error) => {
        console.error('Error generating AI quiz:', error);
        this.isGenerating.set(false);
        alert('Failed to generate AI quiz. Please check console for details.');
      }
    });
  }

  // Form event handlers
  updateTopics(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.aiGeneratorForm.update(form => ({...form, topics: target.value}));
  }

  updateLanguage(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.aiGeneratorForm.update(form => ({...form, language: target.value}));
  }

  updateNumberOfQuestions(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.aiGeneratorForm.update(form => ({...form, numberOfQuestions: +target.value}));
  }

  updateDifficulty(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.aiGeneratorForm.update(form => ({...form, difficulty: target.value as 'easy' | 'medium' | 'hard' | 'mixed'}));
  }

  updateIncludeCode(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.aiGeneratorForm.update(form => ({...form, includeCode: target.checked}));
  }

  // Méthodes pour le template simplifié
  getAiGeneratedCount(): number {
    return this.quizzes()?.filter(quiz => (quiz as any).isAiGenerated).length || 0;
  }

  getValidatedCount(): number {
    return this.quizzes()?.filter(quiz => quiz.isValidated).length || 0;
  }

  getUsersCount(): number {
    return 42; // Mock data
  }

  refreshQuizzes(): void {
    this.loadQuizzes();
  }

  startQuiz(quiz: any): void {
    if (!quiz) return;
    console.log('Starting quiz:', quiz.title);
    // Redirection vers le quiz
  }

  editQuiz(quiz: any): void {
    if (!quiz) return;
    console.log('Editing quiz:', quiz.title);
    // Redirection vers l'éditeur
  }

  deleteQuiz(quiz: any): void {
    if (!quiz) return;
    if (confirm(`Are you sure you want to delete "${quiz.title}"?`)) {
      console.log('Deleting quiz:', quiz.title);
      // Appel API de suppression
    }
  }

  updateTopics(event: any): void {
    const topics = event.target.value;
    this.aiGeneratorForm.update(form => ({ ...form, topics }));
  }

  updateLanguage(event: any): void {
    const language = event.target.value;
    this.aiGeneratorForm.update(form => ({ ...form, language }));
  }

  updateNumberOfQuestions(event: any): void {
    const numberOfQuestions = parseInt(event.target.value);
    this.aiGeneratorForm.update(form => ({ ...form, numberOfQuestions }));
  }

  updateDifficulty(event: any): void {
    const difficulty = event.target.value;
    this.aiGeneratorForm.update(form => ({ ...form, difficulty }));
  }

  updateIncludeCode(event: any): void {
    const includeCode = event.target.checked;
    this.aiGeneratorForm.update(form => ({ ...form, includeCode }));
  }

  // Mock leaderboard data
  mockLeaderboard = [
    { name: 'Alice Cooper', avatar: 'https://ui-avatars.com/api/?name=Alice+Cooper&background=007bff&color=fff', challenges: 25, points: 2500, score: 94 },
    { name: 'Bob Smith', avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&background=28a745&color=fff', challenges: 22, points: 2200, score: 91 },
    { name: 'Carol Jones', avatar: 'https://ui-avatars.com/api/?name=Carol+Jones&background=dc3545&color=fff', challenges: 20, points: 1980, score: 89 },
    { name: 'David Brown', avatar: 'https://ui-avatars.com/api/?name=David+Brown&background=ffc107&color=000', challenges: 18, points: 1750, score: 85 },
    { name: 'Eve Wilson', avatar: 'https://ui-avatars.com/api/?name=Eve+Wilson&background=6f42c1&color=fff', challenges: 16, points: 1600, score: 82 }
  ];
}
