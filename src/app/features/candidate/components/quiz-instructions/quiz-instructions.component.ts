import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CandidateQuizService, QuizSessionInfo } from '../../services/candidate-quiz.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-quiz-instructions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quiz-instructions.component.html',
  styleUrl: './quiz-instructions.component.css'
})
export class QuizInstructionsComponent implements OnInit {
  
  private route = inject(ActivatedRoute);
  public router = inject(Router); // Rendre public pour l'accès depuis le template
  private quizService = inject(CandidateQuizService);
  
  sessionId: string = '';
  session: QuizSessionInfo | null = null;
  loading = true;
  error = '';
  
  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    if (this.sessionId) {
      this.loadSessionInfo();
    } else {
      this.error = 'ID de session manquant';
      this.loading = false;
    }
  }
  
  async loadSessionInfo(): Promise<void> {
    try {
      this.session = await firstValueFrom(this.quizService.getSessionInfo(this.sessionId));
      this.loading = false;
    } catch (error) {
      console.error('Erreur chargement session:', error);
      this.error = 'Erreur lors du chargement des informations du quiz';
      this.loading = false;
    }
  }
  
  startQuiz(): void {
    if (this.sessionId) {
      this.router.navigate(['/candidate/quiz-taking', this.sessionId]);
    }
  }
  
  getDifficultyLabel(difficulty: string): string {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'hard': return 'Avancé';
      default: return difficulty || 'Standard';
    }
  }
  
  getLanguageLabel(language: string): string {
    switch (language?.toLowerCase()) {
      case 'java': return 'Java';
      case 'python': return 'Python';
      case 'javascript': return 'JavaScript';
      case 'typescript': return 'TypeScript';
      default: return language || 'Général';
    }
  }
  
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
    }
  }
}
