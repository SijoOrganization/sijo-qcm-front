import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface StartQuizRequest {
  candidateId: string;
  quizId: string;
  durationMinutes: number;
}

export interface QuizSessionResponse {
  sessionId: string;
  quizTitle: string;
  totalQuestions: number;
  durationMinutes: number;
  remainingTimeSeconds: number;
  status: string;
}

export interface SubmitAnswerRequest {
  questionId: string;
  questionType: string;
  selectedOptionId?: string;
  codeSubmission?: string;
  programmingLanguage?: string;
  textAnswer?: string;
  timeSpentSeconds?: number;
}

export interface QuizSessionStatus {
  sessionId: string;
  status: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredQuestions: number;
  remainingTimeSeconds: number;
  completionPercentage: number;
  markedForReview: number;
}

export interface FinishQuizResponse {
  sessionId: string;
  totalScore: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpentMinutes: number;
  scoresByType: { [key: string]: number };
}

export interface QuizSessionInfo {
  id: string;
  quizId: string;
  candidateId: string;
  remainingTimeSeconds: number;
  status: string;
  quiz?: {
    title: string;
    difficulty: string;
    language: string;
    estimatedDuration: number;
    questions: any[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class CandidateQuizService {

  private apiUrl = environment.backendUrl || 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  /**
   * 🆕 Démarrer une session de quiz
   */
  startQuiz(request: StartQuizRequest): Observable<QuizSessionResponse> {
    return this.http.post<QuizSessionResponse>(`${this.apiUrl}/candidate/start-quiz`, request);
  }

  /**
   * 📋 Obtenir les informations de la session
   */
  getSessionInfo(sessionId: string): Observable<QuizSessionInfo> {
    return this.http.get<QuizSessionInfo>(`${this.apiUrl}/candidate/session/${sessionId}/info`);
  }

  /**
   * ❓ Obtenir la question courante
   */
  getCurrentQuestion(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidate/session/${sessionId}/current-question`);
  }

  /**
   * 📝 Soumettre une réponse
   */
  submitAnswer(sessionId: string, answer: SubmitAnswerRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/candidate/session/${sessionId}/submit-answer`, answer);
  }

  /**
   * ⏭️ Naviguer vers une question
   */
  navigateToQuestion(sessionId: string, questionIndex: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/candidate/session/${sessionId}/navigate`, { questionIndex });
  }

  /**
   * 🔖 Marquer pour révision
   */
  markForReview(sessionId: string, questionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/candidate/session/${sessionId}/mark-review`, { questionId });
  }

  /**
   * ⏸️ Mettre en pause
   */
  pauseSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/candidate/session/${sessionId}/pause`, {});
  }

  /**
   * ▶️ Reprendre
   */
  resumeSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/candidate/session/${sessionId}/resume`, {});
  }

  /**
   * ⏹️ Terminer le quiz
   */
  finishQuiz(sessionId: string): Observable<FinishQuizResponse> {
    return this.http.post<FinishQuizResponse>(`${this.apiUrl}/candidate/session/${sessionId}/finish`, {});
  }

  /**
   * 📊 Obtenir le statut de la session
   */
  getSessionStatus(sessionId: string): Observable<QuizSessionStatus> {
    return this.http.get<QuizSessionStatus>(`${this.apiUrl}/candidate/session/${sessionId}/status`);
  }

  /**
   * 🕒 Obtenir le temps restant
   */
  getTimeRemaining(sessionId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidate/session/${sessionId}/time-remaining`);
  }

  /**
   * 🚨 Signaler une activité suspecte
   */
  reportSuspiciousActivity(sessionId: string, activityType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/candidate/session/${sessionId}/report-activity`, { activityType });
  }
}
