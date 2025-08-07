import { Component, EventEmitter, Output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { QuizAiAdapterService } from '../../../../shared/services/quiz-ai-adapter.service';
import { AlertService } from '../../../../core/alert/services/alert.service';
import { SpinnerService } from '../../../../shared/services/spinner.service';
import { Quiz } from '../../../../shared/models/quiz.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-ai-quiz-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ai-quiz-generator.component.html',
  styleUrl: './ai-quiz-generator.component.css'
})
export class AiQuizGeneratorComponent implements OnInit {
  @Output() quizGenerated = new EventEmitter<Quiz>();

  generatorForm: FormGroup;
  isGenerating = signal(false);
  activeTab = signal('basic');
  
  difficulties = [
    { 
      value: 'easy', 
      label: 'Debutant', 
      description: 'Concepts de base et syntaxe fondamentale',
      icon: '🌱',
      color: '#28a745'
    },
    { 
      value: 'medium', 
      label: 'Intermediaire', 
      description: 'Algorithmes et structures de donnees',
      icon: '⚡',
      color: '#ffc107'
    },
    { 
      value: 'hard', 
      label: 'Avance', 
      description: 'Optimisation et concepts complexes',
      icon: '🚀',
      color: '#dc3545'
    }
  ];

  languages = [
    { value: 'Java', label: 'Java', icon: '☕', color: '#f89820' },
    { value: 'Python', label: 'Python', icon: '🐍', color: '#3776ab' },
    { value: 'JavaScript', label: 'JavaScript', icon: '⚡', color: '#f7df1e' },
    { value: 'TypeScript', label: 'TypeScript', icon: '🔷', color: '#3178c6' }
  ];

  categories = [
    { value: 'algorithmes', label: 'Algorithmes', icon: '🧮' },
    { value: 'structures-de-donnees', label: 'Structures de donnees', icon: '📊' },
    { value: 'programmation-orientee-objet', label: 'POO', icon: '🏗️' },
    { value: 'bases-de-donnees', label: 'Bases de donnees', icon: '🗄️' }
  ];

  popularPresets = [
    {
      name: 'Interview Junior Java',
      topic: 'Fondamentaux Java et POO',
      language: 'Java',
      difficulty: 'easy',
      numberOfQuestions: 8,
      includeCoding: true,
      category: 'programmation-orientee-objet'
    },
    {
      name: 'Senior JavaScript/React',
      topic: 'React Hooks, Context, Performance',
      language: 'JavaScript',
      difficulty: 'hard',
      numberOfQuestions: 12,
      includeCoding: true,
      category: 'architecture-logicielle'
    }
  ];

  generationStats = signal({
    totalGenerated: 0,
    lastGeneratedAt: null as Date | null,
    avgGenerationTime: 0
  });

  constructor(
    private fb: FormBuilder,
    private quizAiService: QuizAiAdapterService,
    private alertService: AlertService,
    private spinnerService: SpinnerService,
    private router: Router
  ) {
    this.generatorForm = this.fb.group({
      topic: ['', [Validators.required, Validators.minLength(3)]],
      numberOfQuestions: [5, [Validators.required, Validators.min(1), Validators.max(20)]],
      difficulty: ['medium', Validators.required],
      language: ['Java', Validators.required],
      category: ['algorithmes'],
      includeCoding: [true],
      aiProvider: ['openai'],
      enableMixedTypes: [true],
      qcmPercentage: [60, [Validators.min(0), Validators.max(100)]],
      codingPercentage: [25, [Validators.min(0), Validators.max(100)]],
      fillBlankPercentage: [15, [Validators.min(0), Validators.max(100)]]
    });

    this.generatorForm.get('qcmPercentage')?.valueChanges.subscribe(() => this.validatePercentages());
    this.generatorForm.get('codingPercentage')?.valueChanges.subscribe(() => this.validatePercentages());
    this.generatorForm.get('fillBlankPercentage')?.valueChanges.subscribe(() => this.validatePercentages());
  }

  ngOnInit() {
    console.log('🚀 AI Quiz Generator SIJO component initialized');
    this.loadGenerationStats();
    
    if (this.generatorForm.disabled) {
      this.generatorForm.enable();
    }
  }

  private validatePercentages() {
    const qcm = this.generatorForm.get('qcmPercentage')?.value || 0;
    const coding = this.generatorForm.get('codingPercentage')?.value || 0;
    const fillBlank = this.generatorForm.get('fillBlankPercentage')?.value || 0;
    
    const total = qcm + coding + fillBlank;
    
    if (total !== 100) {
      const remaining = 100 - qcm - coding;
      this.generatorForm.patchValue({ fillBlankPercentage: Math.max(0, remaining) }, { emitEvent: false });
    }
  }

  private loadGenerationStats() {
    const stats = localStorage.getItem('sijo-quiz-generation-stats');
    if (stats) {
      this.generationStats.set(JSON.parse(stats));
    }
  }

  private updateGenerationStats(generationTime: number) {
    const current = this.generationStats();
    const updated = {
      totalGenerated: current.totalGenerated + 1,
      lastGeneratedAt: new Date(),
      avgGenerationTime: (current.avgGenerationTime * current.totalGenerated + generationTime) / (current.totalGenerated + 1)
    };
    
    this.generationStats.set(updated);
    localStorage.setItem('sijo-quiz-generation-stats', JSON.stringify(updated));
  }

  setActiveTab(tab: string) {
    this.activeTab.set(tab);
  }

  applyPreset(preset: any) {
    this.generatorForm.patchValue({
      topic: preset.topic,
      language: preset.language,
      difficulty: preset.difficulty,
      numberOfQuestions: preset.numberOfQuestions,
      includeCoding: preset.includeCoding,
      category: preset.category
    });
    
    this.setActiveTab('basic');
    
    this.alertService.setMessage({
      type: 'info',
      message: `Preset "${preset.name}" applique avec succes !`
    });
  }

  async generateQuickQuiz() {
    if (!this.generatorForm.valid) {
      this.alertService.setMessage({
        type: 'error',
        message: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }

    const formData = this.generatorForm.value;
    const startTime = Date.now();
    
    this.isGenerating.set(true);
    this.spinnerService.openGlobalSpinner();

    try {
      const quiz = await this.quizAiService.generateAiQuiz({
        topic: formData.topic,
        numberOfQuestions: formData.numberOfQuestions,
        difficulty: formData.difficulty,
        language: formData.language,
        includeCoding: formData.includeCoding
      });

      const generationTime = Date.now() - startTime;
      this.updateGenerationStats(generationTime);

      this.alertService.setMessage({
        type: 'success',
        message: `Quiz "${quiz.title}" genere en ${(generationTime/1000).toFixed(1)}s !`
      });
      
      this.quizGenerated.emit(quiz);
      
      if (confirm('Voulez-vous voir le quiz genere maintenant ?')) {
        this.router.navigate(['/admin/quiz', quiz._id]);
      }
      
      this.generatorForm.patchValue({
        topic: '',
        numberOfQuestions: 5
      });

    } catch (error: any) {
      console.error('Erreur generation quiz IA:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur generation: ' + (error.message || 'Erreur inconnue')
      });
    } finally {
      this.isGenerating.set(false);
      this.spinnerService.closeGlobalSpinner();
    }
  }

  async generateAdvancedQuiz() {
    if (!this.generatorForm.valid) {
      this.alertService.setMessage({
        type: 'error',
        message: 'Veuillez remplir tous les champs obligatoires'
      });
      return;
    }

    const formData = this.generatorForm.value;
    const startTime = Date.now();
    
    this.isGenerating.set(true);
    this.spinnerService.openGlobalSpinner();

    try {
      const quiz = await this.quizAiService.generateAiQuiz({
        topic: formData.topic,
        numberOfQuestions: formData.numberOfQuestions,
        difficulty: formData.difficulty,
        language: formData.language,
        category: formData.category,
        includeCoding: formData.includeCoding,
        aiProvider: formData.aiProvider
      });

      const generationTime = Date.now() - startTime;
      this.updateGenerationStats(generationTime);

      this.alertService.setMessage({
        type: 'success',
        message: `Quiz avance "${quiz.title}" genere en ${(generationTime/1000).toFixed(1)}s !`
      });
      
      this.quizGenerated.emit(quiz);

      if (confirm('Voulez-vous voir le quiz genere maintenant ?')) {
        this.router.navigate(['/admin/quiz', quiz._id]);
      }

    } catch (error: any) {
      console.error('Erreur generation quiz avance:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Erreur generation avancee: ' + (error.message || 'Erreur inconnue')
      });
    } finally {
      this.isGenerating.set(false);
      this.spinnerService.closeGlobalSpinner();
    }
  }

  async testAiConnection() {
    this.spinnerService.openGlobalSpinner();
    
    try {
      await this.quizAiService.generateAiQuiz({
        topic: 'test-connection',
        numberOfQuestions: 1,
        difficulty: 'easy',
        language: 'Java',
        includeCoding: false
      });
      
      this.alertService.setMessage({
        type: 'success',
        message: 'Connexion IA SIJO fonctionnelle !'
      });
    } catch (error: any) {
      console.error('Test connexion IA echoue:', error);
      this.alertService.setMessage({
        type: 'error',
        message: 'Echec connexion IA: ' + (error.message || 'Verifiez la configuration OpenAI')
      });
    } finally {
      this.spinnerService.closeGlobalSpinner();
    }
  }

  get formErrors() {
    const errors: string[] = [];
    
    if (this.generatorForm.get('topic')?.hasError('required')) {
      errors.push('Le sujet est obligatoire');
    }
    if (this.generatorForm.get('topic')?.hasError('minlength')) {
      errors.push('Le sujet doit contenir au moins 3 caracteres');
    }
    if (this.generatorForm.get('numberOfQuestions')?.hasError('min')) {
      errors.push('Minimum 1 question');
    }
    if (this.generatorForm.get('numberOfQuestions')?.hasError('max')) {
      errors.push('Maximum 20 questions');
    }
    
    return errors;
  }

  getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return '#28a745';
      case 'medium': return '#ffc107';
      case 'hard': return '#dc3545';
      default: return '#6c757d';
    }
  }
}
