import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { QuizService } from '../../services/quiz.service';
import { AlertService } from '../../../../core/alert/services/alert.service';
import { SpinnerService } from '../../../../shared/services/spinner.service';

export interface AiQuizRequest {
  subject: string;
  topics: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  numberOfQuestions: number;
  language: string;
  includeCode: boolean;
  questionTypes: string[];
}

@Component({
  selector: 'app-ai-quiz-generator',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ai-quiz-generator.component.html',
  styleUrl: './ai-quiz-generator.component.css'
})
export class AiQuizGeneratorComponent implements OnInit {
  
  generatorForm: FormGroup;
  isGenerating = signal(false);
  result: any = null;
  error: string | null = null;
  
  // Options pour le formulaire
  languages = [
    { value: 'Java', label: 'Java', icon: '☕' },
    { value: 'Python', label: 'Python', icon: '🐍' },
    { value: 'JavaScript', label: 'JavaScript', icon: '🟨' },
    { value: 'TypeScript', label: 'TypeScript', icon: '🔷' },
    { value: 'C++', label: 'C++', icon: '⚡' },
    { value: 'C#', label: 'C#', icon: '🔵' },
    { value: 'Go', label: 'Go', icon: '🐹' },
    { value: 'Rust', label: 'Rust', icon: '🦀' }
  ];
  
  difficulties = [
    { value: 'easy', label: 'Débutant', description: 'Concepts de base', color: '#28a745' },
    { value: 'medium', label: 'Intermédiaire', description: 'Logique et structures', color: '#ffc107' },
    { value: 'hard', label: 'Avancé', description: 'Optimisation et patterns', color: '#dc3545' }
  ];
  
  predefinedTopics = [
    'Variables et Types',
    'Conditions et Boucles',
    'Fonctions et Méthodes',
    'Classes et Objets',
    'Héritage et Polymorphisme',
    'Collections et Tableaux',
    'Gestion des Exceptions',
    'Algorithmes de Tri',
    'Structures de Données',
    'Programmation Fonctionnelle',
    'Design Patterns',
    'Concurrence et Threading',
    'Tests Unitaires',
    'Performance et Optimisation'
  ];
  
  selectedTopics: string[] = [];
  
  constructor(
    private fb: FormBuilder,
    private quizService: QuizService,
    private router: Router,
    private alertService: AlertService,
    private spinnerService: SpinnerService
  ) {
    this.generatorForm = this.fb.group({
      subject: ['', [Validators.required, Validators.minLength(3)]],
      topics: [''],
      difficulty: ['medium', Validators.required],
      numberOfQuestions: [10, [Validators.required, Validators.min(1), Validators.max(20)]],
      language: ['Java', Validators.required],
      includeCode: [true],
      questionTypes: [['qcm', 'coding', 'fill-blank']]
    });
  }
  
  ngOnInit(): void {
    // Initialisation
  }
  
  toggleTopic(topic: string): void {
    const index = this.selectedTopics.indexOf(topic);
    if (index > -1) {
      this.selectedTopics.splice(index, 1);
    } else {
      this.selectedTopics.push(topic);
    }
    this.updateTopicsString();
  }
  
  private updateTopicsString(): void {
    const topicsValue = this.selectedTopics.length > 0 
      ? this.selectedTopics.join(', ') 
      : this.generatorForm.get('subject')?.value || '';
    this.generatorForm.patchValue({ topics: topicsValue });
  }
  
  generateQuiz(): void {
    const formValue = this.generatorForm.value;
    if (!formValue.subject?.trim() && this.selectedTopics.length === 0) {
      this.error = 'Veuillez saisir un sujet ou sélectionner des topics';
      return;
    }
    
    this.isGenerating.set(true);
    this.error = null;
    this.result = null;
    
    // Préparer la requête
    const requestData = {
      subject: formValue.subject || '',
      topics: this.selectedTopics.length > 0 ? this.selectedTopics.join(', ') : formValue.subject?.trim() || '',
      difficulty: formValue.difficulty,
      numberOfQuestions: formValue.numberOfQuestions,
      language: formValue.language,
      includeCode: formValue.includeCode,
      questionTypes: formValue.questionTypes
    };
    
    console.log('Génération du quiz avec:', requestData);
    
    // Appeler le service pour générer le quiz
    this.quizService.generateAIQuiz(requestData).subscribe({
      next: (response) => {
        console.log('Quiz généré:', response);
        this.result = {
          quiz: response.quiz,
          questionsGenerated: response.quiz.questions.length,
          generationTimeMs: response.metadata.generationTime,
          confidence: response.metadata.confidence
        };
        this.isGenerating.set(false);
        
        // Rediriger vers la page de visualisation du quiz après 2 secondes
        setTimeout(() => {
          if (response.quiz && response.quiz._id) {
            this.router.navigate(['/quiz', response.quiz._id]);
          }
        }, 2000);
      },
      error: (error) => {
        console.error('Erreur génération:', error);
        this.error = error.message || 'Erreur lors de la génération du quiz';
        this.isGenerating.set(false);
      }
    });
  }
  
  onSubjectChange(): void {
    if (this.selectedTopics.length === 0) {
      const subject = this.generatorForm.get('subject')?.value || '';
      this.generatorForm.patchValue({ topics: subject });
    }
  }
  
  getDifficultyColor(difficulty: string): string {
    const diff = this.difficulties.find(d => d.value === difficulty);
    return diff ? diff.color : '#6c757d';
  }
  
  getLanguageIcon(language: string): string {
    const lang = this.languages.find(l => l.value === language);
    return lang ? lang.icon : '💻';
  }
}
