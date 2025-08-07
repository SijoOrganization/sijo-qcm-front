import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CodingQuestion, FunctionSignature, TestCase } from '../../../shared/models/codingQuestion.model';

export interface AiQuizRequest {
  subject: string;
  topics: string[];
  difficulty: string;
  totalQuestions: number;
  language: string;
  questionTypes: string[];
}

export interface AiQuizResponse {
  success: boolean;
  quiz: any;
  questionsGenerated: number;
  generationTimeMs: number;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuizAiAdapterService {
  
  private readonly apiUrl = `${environment.backendUrl}/admin/ai-quiz`;
  
  constructor(private http: HttpClient) {}
  
  /**
   * Génère un quiz avec l'IA
   */
  generateAiQuiz(request: AiQuizRequest): Observable<AiQuizResponse> {
    return this.http.post<AiQuizResponse>(`${this.apiUrl}/generate`, request);
  }
  
  /**
   * Test de connexion à l'API IA
   */
  testAiConnection(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test-ai-connection`);
  }
  
  /**
   * Génération rapide de quiz
   */
  quickGenerate(language: string, topic: string, count: number, difficulty: string = 'moyen'): Observable<AiQuizResponse> {
    const request: AiQuizRequest = {
      subject: topic,
      topics: [topic],
      difficulty,
      totalQuestions: count,
      language,
      questionTypes: ['coding', 'qcm']
    };
    
    return this.http.post<AiQuizResponse>(`${this.apiUrl}/quick-generate`, request);
  }
  
  /**
   * Statistiques de génération IA
   */
  getAiStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
  
  /**
   * Convertit une question IA en question de coding compatible
   */
  convertAiQuestionToCoding(aiQuestion: any, language: string): CodingQuestion {
    // Trouve la signature de fonction pour le langage spécifié
    const signatures = aiQuestion.functionSignatures || [];
    const signature = signatures.find((sig: FunctionSignature) => 
      sig.language.toLowerCase() === language.toLowerCase()
    );
    
    if (!signature) {
      throw new Error(`Aucune signature trouvée pour le langage ${language}`);
    }
    
    return {
      id: aiQuestion.id || `coding_${Date.now()}`,
      title: aiQuestion.title || aiQuestion.text,
      description: aiQuestion.description || '',
      functionName: aiQuestion.functionName || 'solution',
      testCases: aiQuestion.testCases || [],
      functionSignatures: signatures
    };
  }
  
  /**
   * Valide une question générée par IA
   */
  validateAiQuestion(question: any): boolean {
    if (!question) return false;
    
    // Validation basique
    if (!question.text || question.text.trim() === '') return false;
    if (!question.type) return false;
    
    // Validation spécifique selon le type
    switch (question.type) {
      case 'coding':
        return this.validateCodingQuestion(question);
      case 'qcm':
        return this.validateQcmQuestion(question);
      case 'fill-in-the-blank':
        return this.validateFillQuestion(question);
      default:
        return false;
    }
  }
  
  private validateCodingQuestion(question: any): boolean {
    return !!(
      question.testCases && 
      Array.isArray(question.testCases) && 
      question.testCases.length > 0 &&
      question.functionSignatures &&
      Array.isArray(question.functionSignatures) &&
      question.functionSignatures.length > 0
    );
  }
  
  private validateQcmQuestion(question: any): boolean {
    return !!(
      question.answers && 
      Array.isArray(question.answers) && 
      question.answers.length >= 2 &&
      question.answers.some((answer: any) => answer.isCorrect === true)
    );
  }
  
  private validateFillQuestion(question: any): boolean {
    return !!(
      question.expectedAnswer && 
      question.expectedAnswer.trim() !== '' &&
      question.text &&
      question.text.includes('_')
    );
  }
}
