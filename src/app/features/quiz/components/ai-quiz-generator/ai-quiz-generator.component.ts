import { Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AIQuizGeneratorService, AIQuizGenerationRequest } from '../../services/ai-quiz-generator.service';
import { QuestionBankService } from '../../services/question-bank.service';
import { QuizService } from '../../services/quiz.service';

@Component({
  selector: 'app-ai-quiz-generator',
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-quiz-generator.component.html',
  styleUrl: './ai-quiz-generator.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AIQuizGeneratorComponent {
  private aiQuizGenerator = inject(AIQuizGeneratorService);
  private questionBankService = inject(QuestionBankService);
  private quizService = inject(QuizService);
  private router = inject(Router);

  // Generation status
  isGenerating = this.aiQuizGenerator.isGenerating;
  generationProgress = signal(0);
  generationMessage = signal('');

  // Form data
  generationForm = signal<AIQuizGenerationRequest>({
    topics: [],
    difficulty: 'medium',
    languages: ['Java'],
    questionTypes: ['qcm', 'fill-in-the-blank', 'coding'],
    questionCount: 10,
    codingQuestionCount: 3,
    includeExistingQuestions: true,
    validatedOnly: true
  });

  // Available options
  availableLanguages = ['Java', 'Python', 'TypeScript', 'JavaScript', 'C++', 'C#'];
  availableDifficulties = ['easy', 'medium', 'hard', 'mixed'];
  availableQuestionTypes: { value: 'qcm' | 'fill-in-the-blank' | 'coding'; label: string }[] = [
    { value: 'qcm', label: 'Multiple Choice' },
    { value: 'fill-in-the-blank', label: 'Fill in the Blank' },
    { value: 'coding', label: 'Coding Challenges' }
  ];

  // Topic suggestions
  topicSuggestions = [
    'Data Structures', 'Algorithms', 'Object-Oriented Programming', 'Design Patterns',
    'Database Management', 'Web Development', 'API Design', 'Software Architecture',
    'Testing', 'Version Control', 'Frameworks', 'Security', 'Performance Optimization'
  ];

  // New topic input
  newTopic = signal('');

  updateForm<K extends keyof AIQuizGenerationRequest>(key: K, value: AIQuizGenerationRequest[K]) {
    this.generationForm.update(form => ({ ...form, [key]: value }));
  }

  addTopic(topic: string) {
    if (topic.trim() && !this.generationForm().topics.includes(topic.trim())) {
      this.updateForm('topics', [...this.generationForm().topics, topic.trim()]);
    }
    this.newTopic.set('');
  }

  removeTopic(topic: string) {
    this.updateForm('topics', this.generationForm().topics.filter(t => t !== topic));
  }

  addSuggestedTopic(topic: string) {
    this.addTopic(topic);
  }

  toggleQuestionType(type: 'qcm' | 'fill-in-the-blank' | 'coding') {
    const currentTypes = this.generationForm().questionTypes;
    if (currentTypes.includes(type)) {
      this.updateForm('questionTypes', currentTypes.filter(t => t !== type));
    } else {
      this.updateForm('questionTypes', [...currentTypes, type]);
    }
  }

  toggleLanguage(language: string) {
    const currentLanguages = this.generationForm().languages;
    if (currentLanguages.includes(language)) {
      this.updateForm('languages', currentLanguages.filter(l => l !== language));
    } else {
      this.updateForm('languages', [...currentLanguages, language]);
    }
  }

  async generateQuiz() {
    const form = this.generationForm();
    
    // Validation
    if (form.topics.length === 0) {
      alert('Please add at least one topic');
      return;
    }

    if (form.questionCount < 1 || form.questionCount > 50) {
      alert('Question count must be between 1 and 50');
      return;
    }

    // Start generation
    this.generationProgress.set(0);
    this.generationMessage.set('Starting quiz generation...');

    try {
      // Simulate progress updates
      this.simulateProgress();

      // Use the simplified back-end generation
      const topicsString = form.topics.join(', ');
      const quiz = await this.aiQuizGenerator.generateQuizWithBackend(topicsString, form.questionCount).toPromise();
      
      if (quiz) {
        this.generationProgress.set(100);
        this.generationMessage.set('Quiz generated successfully! It has been added to the admin dashboard for validation.');
        
        // Navigate to the admin dashboard to see pending quizzes
        setTimeout(() => {
          this.router.navigate(['/admin']);
        }, 2000);
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      this.generationMessage.set('Error generating quiz. Please try again.');
    }
  }

  private simulateProgress() {
    const steps = [
      { progress: 10, message: 'Analyzing topics and requirements...' },
      { progress: 25, message: 'Searching existing question bank...' },
      { progress: 40, message: 'Generating new questions with AI...' },
      { progress: 60, message: 'Validating question quality...' },
      { progress: 80, message: 'Assembling final quiz...' },
      { progress: 95, message: 'Finalizing quiz structure...' }
    ];

    steps.forEach((step, index) => {
      setTimeout(() => {
        this.generationProgress.set(step.progress);
        this.generationMessage.set(step.message);
      }, index * 800);
    });
  }

  resetForm() {
    this.generationForm.set({
      topics: [],
      difficulty: 'medium',
      languages: ['Java'],
      questionTypes: ['qcm', 'fill-in-the-blank', 'coding'],
      questionCount: 10,
      codingQuestionCount: 3,
      includeExistingQuestions: true,
      validatedOnly: true
    });
    this.newTopic.set('');
    this.generationProgress.set(0);
    this.generationMessage.set('');
  }
}
