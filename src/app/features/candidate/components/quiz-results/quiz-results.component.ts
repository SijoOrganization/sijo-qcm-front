import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { CandidateQuizService } from '../../services/candidate-quiz.service';
import { firstValueFrom } from 'rxjs';

interface QuizResult {
  sessionId: string;
  totalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpentMinutes: number;
  scoresByType: { [key: string]: number };
  percentage?: number;
  passed?: boolean;
}

@Component({
  selector: 'app-quiz-results',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './quiz-results.component.html',
  styleUrl: './quiz-results.component.css'
})
export class QuizResultsComponent implements OnInit {
  
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private quizService = inject(CandidateQuizService);
  
  sessionId: string = '';
  results: QuizResult | null = null;
  loading = true;
  error = '';
  
  // Configuration des seuils
  passingScore = 70; // 70% pour réussir
  
  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    if (this.sessionId) {
      this.loadResults();
    } else {
      this.error = 'ID de session manquant';
      this.loading = false;
    }
  }
  
  async loadResults(): Promise<void> {
    try {
      // Pour l'instant, on simule les résultats car l'endpoint finishQuiz retourne déjà les résultats
      // Dans une implémentation complète, il faudrait un endpoint séparé pour récupérer les résultats
      
      // Simulation des résultats basée sur la structure attendue du backend
      this.results = {
        sessionId: this.sessionId,
        totalScore: 85.5,
        correctAnswers: 17,
        totalQuestions: 20,
        timeSpentMinutes: 45,
        scoresByType: {
          'QCM': 75.0,
          'CODING': 90.0,
          'FILL_BLANK': 80.0
        }
      };
      
      this.calculateAdditionalMetrics();
      this.loading = false;
      
    } catch (error) {
      console.error('Erreur chargement résultats:', error);
      this.error = 'Erreur lors du chargement des résultats';
      this.loading = false;
    }
  }
  
  calculateAdditionalMetrics(): void {
    if (!this.results) return;
    
    // Calculer le pourcentage
    this.results.percentage = Math.round((this.results.correctAnswers / this.results.totalQuestions) * 100);
    
    // Déterminer si le candidat a réussi
    this.results.passed = (this.results.percentage || 0) >= this.passingScore;
  }
  
  getScoreColor(): string {
    if (!this.results?.percentage) return 'text-gray-600';
    
    if (this.results.percentage >= 90) return 'text-green-600';
    if (this.results.percentage >= this.passingScore) return 'text-blue-600';
    if (this.results.percentage >= 50) return 'text-orange-500';
    return 'text-red-500';
  }
  
  getScoreIcon(): string {
    if (!this.results?.percentage) return '❓';
    
    if (this.results.percentage >= 90) return '🏆';
    if (this.results.percentage >= this.passingScore) return '✅';
    if (this.results.percentage >= 50) return '⚠️';
    return '❌';
  }
  
  getScoreLabel(): string {
    if (!this.results?.percentage) return 'Score indéterminé';
    
    if (this.results.percentage >= 90) return 'Excellent';
    if (this.results.percentage >= this.passingScore) return 'Réussi';
    if (this.results.percentage >= 50) return 'Passable';
    return 'Insuffisant';
  }
  
  getScoreTypes(): string[] {
    return this.results ? Object.keys(this.results.scoresByType) : [];
  }
  
  getTypeLabel(type: string): string {
    switch (type) {
      case 'QCM': return 'Questions à Choix Multiple';
      case 'CODING': return 'Questions de Code';
      case 'FILL_BLANK': return 'Textes à Trous';
      default: return type;
    }
  }
  
  getTypeIcon(type: string): string {
    switch (type) {
      case 'QCM': return '📝';
      case 'CODING': return '💻';
      case 'FILL_BLANK': return '📄';
      default: return '📋';
    }
  }
  
  getTypeWeight(type: string): number {
    // Poids selon les spécifications : QCM 40%, Coding 50%, Fill-blank 10%
    switch (type) {
      case 'QCM': return 40;
      case 'CODING': return 50;
      case 'FILL_BLANK': return 10;
      default: return 0;
    }
  }
  
  getProgressColor(score: number): string {
    if (score >= 90) return 'progress-excellent';
    if (score >= 70) return 'progress-good';
    if (score >= 50) return 'progress-average';
    return 'progress-poor';
  }
  
  getRecommendations(): string[] {
    if (!this.results) return [];
    
    const recommendations: string[] = [];
    
    if (this.results.scoresByType['QCM'] < 70) {
      recommendations.push('Réviser les concepts théoriques et les bonnes pratiques');
    }
    
    if (this.results.scoresByType['CODING'] < 70) {
      recommendations.push('Pratiquer davantage la programmation et les algorithmes');
    }
    
    if (this.results.scoresByType['FILL_BLANK'] < 70) {
      recommendations.push('Améliorer la connaissance de la syntaxe et des mots-clés');
    }
    
    if (this.results.percentage! >= 90) {
      recommendations.push('Excellent niveau ! Continuez ainsi et explorez des sujets avancés');
    } else if (this.results.percentage! >= this.passingScore) {
      recommendations.push('Bon niveau général, continuez à vous perfectionner');
    }
    
    return recommendations;
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
  
  goHome(): void {
    this.router.navigate(['/candidate']);
  }
  
  downloadCertificate(): void {
    if (this.results?.passed) {
      // TODO: Implémenter la génération de certificat
      alert('Fonctionnalité de certificat en développement');
    }
  }
  
  viewDetailedResults(): void {
    // TODO: Naviguer vers une vue détaillée des résultats question par question
    alert('Vue détaillée en développement');
  }
}
