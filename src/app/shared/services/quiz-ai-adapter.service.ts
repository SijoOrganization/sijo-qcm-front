import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Quiz } from '../models/quiz.model';

export interface AiQuizRequest {
  topic: string;
  numberOfQuestions: number;
  difficulty: string;
  language: string;
  category?: string;
  includeCoding?: boolean;
  aiProvider?: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuizAiAdapterService {
  private apiUrl = environment.backendUrl;

  constructor(private http: HttpClient) {}

  /**
   * 🤖 Génération de quiz via IA
   */
  async generateAiQuiz(request: AiQuizRequest): Promise<Quiz> {
    try {
      const url = `${this.apiUrl}/admin/ai/generate`;
      
      const payload = {
        topic: request.topic,
        numberOfQuestions: request.numberOfQuestions,
        difficulty: request.difficulty,
        language: request.language,
        includeCoding: request.includeCoding || true
      };

      console.log('🚀 Envoi requête AI:', payload);
      
      const response = await firstValueFrom(
        this.http.post<Quiz>(url, payload)
      );

      console.log('✅ Quiz AI reçu:', response);
      return response;

    } catch (error: any) {
      console.error('❌ Erreur génération AI:', error);
      throw new Error(error.error?.message || error.message || 'Erreur génération AI');
    }
  }

  /**
   * 🧪 Test de connexion IA
   */
  async testAiConnection(): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/admin/ai/test-connection`;
      
      const response = await firstValueFrom(
        this.http.get<{ status: string; message: string }>(url)
      );
      
      return response.status === 'success';
      
    } catch (error) {
      console.error('Test connexion IA échoué:', error);
      return false;
    }
  }

  /**
   * 🎯 Génération rapide (méthode alternative)
   */
  generateQuickQuiz(topic: string, language: string, difficulty: string, numberOfQuestions: number): Observable<Quiz> {
    const url = `${this.apiUrl}/admin/ai/quick-generate`;
    
    const payload = {
      topic,
      language,
      difficulty,
      numberOfQuestions
    };

    return this.http.post<Quiz>(url, payload);
  }
}
