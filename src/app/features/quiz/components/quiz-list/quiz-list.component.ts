import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  Signal,
  signal,
} from '@angular/core';
import { RouterLink, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Quiz } from '../../../../shared/models/quiz.model';
import { QuizService, RandomQuizRequest } from '../../services/quiz.service';
import { QuestionBankService } from '../../services/question-bank.service';
import { AIQuizGeneratorService, AIQuizGenerationRequest } from '../../services/ai-quiz-generator.service';

@Component({
  selector: 'app-quiz-list',
  imports: [RouterLink, RouterModule, FormsModule, CommonModule],
  templateUrl: './quiz-list.component.html',
  styleUrl: './quiz-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuizListComponent implements OnInit {
  private questionBankService = inject(QuestionBankService);
  private aiQuizGenerator = inject(AIQuizGeneratorService);
  private router = inject(Router);
  
  // Make services public so they can be accessed in template
  authService = inject(AuthService);
  quizService = inject(QuizService);

  quizzes = this.quizService.quizzes;
  hasTutorAcess = false;
  isGenerating = signal(false);
  isAIGenerating = this.aiQuizGenerator.isGenerating;

  // Enhanced random quiz generation form
  generateForm = signal<RandomQuizRequest>({
    language: 'Java',
    difficulty: 'medium',
    questionCount: 10,
    codingQuestionCount: 3,
    topics: ['algorithms', 'data structures']
  });

  // AI Quiz generation form
  aiGenerateForm = signal({
    topics: ['algorithms', 'data structures', 'programming'],
    difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'mixed',
    languages: ['Java'],
    questionCount: 10,
    codingQuestionCount: 3
  });

  availableLanguages = ['Java', 'Python', 'TypeScript', 'JavaScript', 'C++', 'C#'];
  availableDifficulties = ['easy', 'medium', 'hard', 'mixed'];
  
  // Popular topics for suggestions
  popularTopics = [
    'algorithms', 'data structures', 'object-oriented programming', 'design patterns',
    'database management', 'web development', 'api design', 'testing',
    'version control', 'frameworks', 'security', 'performance optimization'
  ];

  ngOnInit(): void {
    this.hasTutorAcess = this.authService.hasTutorAccess();
    
    // Load quizzes with better error handling
    this.loadQuizzes();
  }

  private loadQuizzes(): void {
    this.quizService.fetchQuizzes().subscribe({
      next: (quizzes) => {
        if (quizzes && Array.isArray(quizzes) && quizzes.length > 0) {
          console.log('Quizzes loaded successfully:', quizzes.length);
        } else {
          console.warn('No quizzes available or empty response');
          // Show user-friendly message if no quizzes
          this.showNoQuizzesMessage();
        }
      },
      error: (error) => {
        console.error('Error loading quizzes:', error);
        this.handleQuizLoadError(error);
      }
    });
  }

  private showNoQuizzesMessage(): void {
    // This could trigger a UI notification
    console.log('No quizzes available. Try creating some or check your connection.');
  }

  private handleQuizLoadError(error: any): void {
    // Log the error and provide user feedback
    console.error('Failed to load quizzes:', error);
    
    // You could show a toast notification or banner here
    // For now, we'll just ensure the signal is set to empty array
    this.quizService.quizzesSignal.set([]);
  }

  updateGenerateForm<K extends keyof RandomQuizRequest>(key: K, value: RandomQuizRequest[K]) {
    this.generateForm.update(form => ({ ...form, [key]: value }));
  }

  updateAIGenerateForm(key: string, value: any) {
    this.aiGenerateForm.update(form => ({ ...form, [key]: value }));
  }

  addTopic(topic: string) {
    if (topic.trim() && !this.generateForm().topics.includes(topic.trim())) {
      this.updateGenerateForm('topics', [...this.generateForm().topics, topic.trim()]);
    }
  }

  removeTopic(topic: string) {
    this.updateGenerateForm('topics', this.generateForm().topics.filter(t => t !== topic));
  }

  addAITopic(topic: string) {
    if (topic.trim() && !this.aiGenerateForm().topics.includes(topic.trim())) {
      this.updateAIGenerateForm('topics', [...this.aiGenerateForm().topics, topic.trim()]);
    }
  }

  removeAITopic(topic: string) {
    this.updateAIGenerateForm('topics', this.aiGenerateForm().topics.filter(t => t !== topic));
  }

  toggleAILanguage(language: string) {
    const currentLanguages = this.aiGenerateForm().languages;
    if (currentLanguages.includes(language)) {
      this.updateAIGenerateForm('languages', currentLanguages.filter(l => l !== language));
    } else {
      this.updateAIGenerateForm('languages', [...currentLanguages, language]);
    }
  }

  generateRandomQuiz(): void {
    const form = this.generateForm();
    if (form.topics.length === 0) {
      alert('Please add at least one topic for the quiz');
      return;
    }

    this.isGenerating.set(true);
    this.quizService.generateRandomQuiz(form).subscribe({
      next: (quiz) => {
        this.isGenerating.set(false);
        // Create the quiz and navigate to it
        this.quizService.createQuiz(quiz).subscribe({
          next: (savedQuiz: Quiz) => {
            this.router.navigate(['/quizzes', savedQuiz._id]);
          },
          error: (error: any) => {
            console.error('Error saving quiz:', error);
            // Navigate anyway with generated quiz
            this.router.navigate(['/quizzes/practice'], { 
              state: { quiz } 
            });
          }
        });
      },
      error: (error) => {
        this.isGenerating.set(false);
        console.error('Error generating quiz:', error);
        alert('Failed to generate quiz. Please try again.');
      }
    });
  }

  generateAIQuiz(): void {
    const form = this.aiGenerateForm();
    if (form.topics.length === 0) {
      alert('Please add at least one topic for the AI quiz');
      return;
    }

    if (form.languages.length === 0) {
      alert('Please select at least one programming language');
      return;
    }

    this.aiQuizGenerator.generateQuiz({
      topics: form.topics,
      difficulty: form.difficulty,
      languages: form.languages,
      questionTypes: ['qcm', 'fill-in-the-blank', 'coding'],
      questionCount: form.questionCount,
      codingQuestionCount: form.codingQuestionCount,
      includeExistingQuestions: true,
      validatedOnly: true
    }).subscribe({
      next: (response) => {
        // Create the quiz and navigate to it
        this.quizService.createQuiz(response.quiz).subscribe({
          next: (savedQuiz: Quiz) => {
            this.router.navigate(['/quizzes', savedQuiz._id]);
          },
          error: (error: any) => {
            console.error('Error saving AI quiz:', error);
            // Navigate anyway with generated quiz
            this.router.navigate(['/quizzes/practice'], { 
              state: { quiz: response.quiz } 
            });
          }
        });
      },
      error: (error) => {
        console.error('Error generating AI quiz:', error);
        alert('Failed to generate AI quiz. Please try again.');
      }
    });
  }

  // Validate quiz (expert validation)
  validateQuiz(quiz: Quiz): void {
    if (!quiz._id) return;
    
    this.quizService.validateQuiz(quiz._id).subscribe({
      next: (updatedQuiz) => {
        console.log('Quiz validated:', updatedQuiz);
        // Update the quiz in the list
        this.quizService.fetchQuizzes();
      },
      error: (error) => {
        console.error('Error validating quiz:', error);
        alert('Failed to validate quiz. Please try again.');
      }
    });
  }

  deleteQuiz(quiz: Quiz): void {
    if (confirm(`Are you sure you want to delete the quiz "${quiz.title}"?`)) {
      this.quizService.deleteQuiz(quiz._id!).subscribe({
        next: () => {
          this.quizService.fetchQuizzes(); // Refresh the list
        },
        error: (error) => {
          console.error('Error deleting quiz:', error);
          alert('Failed to delete quiz. Please try again.');
        }
      });
    }
  }

  // Test AI Quiz Generation
  testAIQuizGeneration() {
    console.log('Testing AI Quiz Generation...');
    
    const aiRequest: AIQuizGenerationRequest = {
      topics: ['JavaScript', 'React'],
      difficulty: 'medium',
      languages: ['JavaScript'],
      questionTypes: ['qcm', 'fill-in-the-blank'],
      questionCount: 5,
      codingQuestionCount: 1,
      includeExistingQuestions: false,
      validatedOnly: false
    };

    this.aiQuizGenerator.generateQuiz(aiRequest).subscribe({
      next: (result) => {
        console.log('AI Quiz generated successfully:', result);
        alert('AI Quiz generated and added to dashboard for validation!');
        
        // Verify it's added to the quiz list
        setTimeout(() => {
          const allQuizzes = this.quizService.quizzes();
          const aiQuiz = allQuizzes.find(q => q._id === result.quiz._id);
          if (aiQuiz) {
            console.log('✅ AI Quiz found in quiz list:', aiQuiz);
          } else {
            console.log('❌ AI Quiz not found in quiz list');
          }
        }, 1000);
      },
      error: (error) => {
        console.error('Error generating AI quiz:', error);
        alert('Error generating AI quiz');
      }
    });
  }

  // Test the complete AI quiz workflow
  testCompleteAIWorkflow() {
    console.log('🚀 Testing complete AI quiz workflow...');
    
    // Step 1: Generate AI quiz
    const aiRequest: AIQuizGenerationRequest = {
      topics: ['Angular', 'TypeScript'],
      difficulty: 'medium',
      languages: ['TypeScript'],
      questionTypes: ['qcm', 'fill-in-the-blank'],
      questionCount: 3,
      codingQuestionCount: 0,
      includeExistingQuestions: false,
      validatedOnly: false
    };

    this.aiQuizGenerator.generateQuiz(aiRequest).subscribe({
      next: (result) => {
        console.log('✅ Step 1: AI Quiz generated successfully');
        console.log('Quiz ID:', result.quiz._id);
        console.log('Quiz title:', result.quiz.title);
        console.log('Quiz is validated:', result.quiz.isValidated);
        
        // Step 2: Verify it appears in dashboard (simulate admin validation)
        setTimeout(() => {
          const allQuizzes = this.quizService.quizzes();
          const newQuiz = allQuizzes.find(q => q._id === result.quiz._id);
          
          if (newQuiz) {
            console.log('✅ Step 2: Quiz found in dashboard');
            console.log('Quiz details:', newQuiz);
            
            // Step 3: Simulate admin validation
            this.quizService.validateQuiz(newQuiz._id!).subscribe({
              next: () => {
                console.log('✅ Step 3: Quiz validated by admin');
                
                // Step 4: Verify it appears in practice mode
                setTimeout(() => {
                  const validatedQuizzes = this.quizService.quizzes().filter(q => q.isValidated);
                  const validatedQuiz = validatedQuizzes.find(q => q._id === result.quiz._id);
                  
                  if (validatedQuiz) {
                    console.log('✅ Step 4: Quiz now available in practice mode');
                    console.log('All validated quizzes:', validatedQuizzes.length);
                    
                    alert(`🎉 Workflow completed successfully!\n\n` +
                          `1. AI Quiz "${result.quiz.title}" generated\n` +
                          `2. Quiz added to admin dashboard\n` +
                          `3. Quiz validated by admin\n` +
                          `4. Quiz now available in practice mode\n\n` +
                          `You can now go to Admin Dashboard to see it, or Practice Mode to test it!`);
                  } else {
                    console.log('❌ Step 4: Quiz not found in practice mode');
                  }
                }, 500);
              },
              error: (error) => {
                console.error('❌ Step 3: Error validating quiz:', error);
              }
            });
          } else {
            console.log('❌ Step 2: Quiz not found in dashboard');
          }
        }, 500);
      },
      error: (error) => {
        console.error('❌ Step 1: Error generating AI quiz:', error);
        alert('Error generating AI quiz. Check console for details.');
      }
    });
  }

  // TrackBy function for ngFor optimization
  trackByQuiz(index: number, quiz: Quiz): string {
    return quiz._id || index.toString();
  }
}
