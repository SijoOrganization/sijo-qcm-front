import { inject, Injectable, signal } from '@angular/core';
import { Quiz, QuizAnswer } from '../../../shared/models/quiz.model';
// import { SampleQuiz } from '../mocks/quiz.mock';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { tap, map, catchError, retry, timeout } from 'rxjs/operators';
import { SubmissionConfirmation } from '../../../shared/models/submission.model';
import { QuestionBankService } from './question-bank.service';

export interface RandomQuizRequest {
  language: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  questionCount: number;
  codingQuestionCount: number;
  topics: string[];
}

export interface AIQuizGenerationRequest {
  topics: string;
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  language: string;
  includeCode: boolean;
}

export interface AIQuizGenerationResponse {
  quiz: Quiz;
  metadata: {
    generationTime: number;
    tokensUsed?: number;
    confidence?: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  http = inject(HttpClient);
  private questionBankService = inject(QuestionBankService);
  
  quizzesSignal = signal<Quiz[]>([]);
  quizzes = this.quizzesSignal.asReadonly();

  submit(
    answers: QuizAnswer,
    quizId: string,
  ): Observable<SubmissionConfirmation> {
    return this.http.post<SubmissionConfirmation>('/api/submissions', {
      answers: this.getSerializedAnswers(answers),
      quizId,
    });
  }

  fetchQuizzes(): Observable<Quiz[]> {
    return this.http.get<Quiz[]>('/api/quizzes').pipe(
      timeout(10000), // 10 second timeout
      retry(2), // Retry up to 2 times
      map(quizzes => {
        if (!quizzes || !Array.isArray(quizzes)) {
          console.warn('Invalid quiz data format received');
          return [];
        }
        
        // Validate and clean each quiz
        return quizzes.map(quiz => {
          try {
            return this.validateAndCleanQuiz(quiz);
          } catch (error) {
            console.error('Error validating quiz:', error);
            return null;
          }
        }).filter(quiz => quiz !== null) as Quiz[];
      }),
      tap((quizzes) => {
        this.quizzesSignal.set(quizzes);
        console.log('Quizzes loaded successfully:', quizzes.length);
      }),
      catchError((error) => {
        console.error('Error fetching quizzes:', error);
        this.quizzesSignal.set([]);
        // Return empty array instead of throwing error
        return of([]);
      })
    );
  }

  fetchFullQuizById(quizId: string): Observable<Quiz> {
    return this.http.get<Quiz>(`/api/quizzes/${quizId}`).pipe(
      map(quiz => {
        if (!quiz) {
          throw new Error('Quiz not found or is null');
        }
        return this.validateAndCleanQuiz(quiz);
      }),
      tap(quiz => {
        console.log(`Fetched and validated quiz "${quiz.title}" with ${quiz.questions.length} questions`);
      }),
      catchError(error => {
        console.error(`Error fetching quiz ${quizId}:`, error);
        return throwError(() => error);
      })
    );
  }

  generateQuiz(topics: string, nbQuestions: string) {
    const params = new HttpParams()
      .set('topics', topics)
      .set('nbQuestions', nbQuestions);
    return this.http.get<Quiz>('/api/quizzes/generate', { params });
  }
  fetchQuizInfo(quizId: string): Observable<Quiz> {
    const quiz = this.quizzes().find((quiz) => quiz._id === quizId);
    if (quiz) {
      return of(quiz);
    }
    return this.http.get<Quiz>(`/api/quizzes/${quizId}?type=info`);
  }

  fetchQuizWithQuestions(quizId: string): Observable<Quiz> {
    // Use mock data instead of API call
    const quiz = this.quizzes().find((quiz) => quiz._id === quizId);
    if (quiz) {
      return of(quiz);
    }
    
    // If not found in mock data, return error
    return throwError(() => new Error(`Quiz with ID ${quizId} not found`));
  }

  // Enhanced random quiz generation
  generateRandomQuiz(request: RandomQuizRequest): Observable<Quiz> {
    return this.questionBankService.getRandomQuestions(request.questionCount, {
      language: request.language,
      difficulty: request.difficulty !== 'mixed' ? request.difficulty : undefined
    }).pipe(
      map(questions => {
        // Ensure we have the right number of coding questions
        const codingQuestions = questions.filter(q => q.type === 'coding');
        const nonCodingQuestions = questions.filter(q => q.type !== 'coding');
        
        let finalQuestions = [...nonCodingQuestions];
        
        // Add coding questions up to the requested count
        if (codingQuestions.length >= request.codingQuestionCount) {
          finalQuestions.push(...codingQuestions.slice(0, request.codingQuestionCount));
        } else {
          finalQuestions.push(...codingQuestions);
        }
        
        // Shuffle the questions
        finalQuestions = finalQuestions.sort(() => 0.5 - Math.random());
        
        // Limit to requested count
        finalQuestions = finalQuestions.slice(0, request.questionCount);
        
        const quiz: Quiz = {
          _id: `random_${Date.now()}`,
          title: `Random ${request.language} Quiz - ${request.difficulty}`,
          explanation: `Generated quiz with ${request.questionCount} questions including ${request.codingQuestionCount} coding challenges`,
          category: `${request.language} - ${request.topics.join(', ')}`,
          questions: finalQuestions
        };
        
        return quiz;
      })
    );
  }

  // Enhanced AI quiz generation
  generateAIQuiz(request: AIQuizGenerationRequest): Observable<AIQuizGenerationResponse> {
    const params = new HttpParams()
      .set('topics', request.topics)
      .set('nbQuestions', request.numberOfQuestions.toString())
      .set('difficulty', request.difficulty)
      .set('language', request.language)
      .set('includeCode', request.includeCode.toString());

    // Use relative URL with corrected interceptor
    return this.http.post<Quiz>('/api/quizzes/generate', null, { params }).pipe(
      timeout(30000), // 30 second timeout for AI generation
      tap(quiz => {
        console.log('AI Quiz generated:', quiz);
        
        // Validate the generated quiz
        if (!quiz) {
          throw new Error('Generated quiz is null');
        }
        
        // Validate and clean the quiz
        quiz = this.validateAndCleanQuiz(quiz);
        
        // Log quiz details
        console.log(`Generated quiz "${quiz.title}" with ${quiz.questions.length} questions`);
        
        if (quiz) {
          // Add the new quiz to the signal
          this.quizzesSignal.update(quizzes => [quiz, ...quizzes]);
        }
      }),
      map(quiz => ({
        quiz,
        metadata: {
          generationTime: Date.now(),
          confidence: 0.95
        }
      })),
      catchError(error => {
        console.error('AI quiz generation failed:', error);
        
        let errorMessage = 'Failed to generate quiz with AI';
        if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        return throwError(() => ({
          message: errorMessage,
          error: error,
          suggestion: 'Try with different parameters or use manual creation'
        }));
      })
    );
  }

  // Batch operations
  generateMultipleQuizzes(requests: AIQuizGenerationRequest[]): Observable<AIQuizGenerationResponse[]> {
    const generations = requests.map(request => this.generateAIQuiz(request));
    return forkJoin(generations).pipe(
      catchError(error => {
        console.error('Batch generation failed:', error);
        return of([]);
      })
    );
  }

  // Quiz CRUD operations
  createQuiz(quiz: Quiz): Observable<Quiz> {
    return this.http.post<Quiz>('/api/quizzes', quiz).pipe(
      tap(newQuiz => {
        this.quizzesSignal.update(quizzes => [...quizzes, newQuiz]);
      }),
      catchError(error => {
        console.error('Quiz creation failed:', error);
        return throwError(() => error);
      })
    );
  }

  updateQuiz(quiz: Quiz): Observable<Quiz> {
    return this.http.put<Quiz>(`/api/quizzes/${quiz._id}`, quiz).pipe(
      tap(updatedQuiz => {
        this.quizzesSignal.update(quizzes => 
          quizzes.map(q => q._id === quiz._id ? updatedQuiz : q)
        );
      }),
      catchError(error => {
        console.error('Quiz update failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Quiz management
  validateQuiz(quizId: string): Observable<Quiz> {
    return this.http.put<Quiz>(`/api/quizzes/${quizId}/validate`, {}).pipe(
      tap(updatedQuiz => {
        this.quizzesSignal.update(quizzes => 
          quizzes.map(q => q._id === quizId ? updatedQuiz : q)
        );
      }),
      catchError(error => {
        console.error('Quiz validation failed:', error);
        return throwError(() => error);
      })
    );
  }

  invalidateQuiz(quizId: string): Observable<Quiz> {
    return this.http.put<Quiz>(`/api/quizzes/${quizId}/invalidate`, {}).pipe(
      tap(updatedQuiz => {
        this.quizzesSignal.update(quizzes => 
          quizzes.map(q => q._id === quizId ? updatedQuiz : q)
        );
      }),
      catchError(error => {
        console.error('Quiz invalidation failed:', error);
        return throwError(() => error);
      })
    );
  }

  deleteQuiz(quizId: string): Observable<void> {
    return this.http.delete<void>(`/api/quizzes/${quizId}`).pipe(
      tap(() => {
        this.quizzesSignal.update(quizzes => 
          quizzes.filter(q => q._id !== quizId)
        );
      }),
      catchError(error => {
        console.error('Quiz deletion failed:', error);
        return throwError(() => error);
      })
    );
  }

  // Enhanced statistics
  getQuizStatisticsEnhanced(quizId: string): Observable<{
    totalAttempts: number;
    averageScore: number;
    completionRate: number;
    difficulty: string;
    mostDifficultQuestions: string[];
    performanceByLanguage: { [key: string]: number };
    recentAttempts: any[];
  }> {
    return this.http.get<any>(`/api/quizzes/${quizId}/statistics/enhanced`).pipe(
      catchError(error => {
        console.error('Failed to fetch enhanced statistics:', error);
        // Return basic statistics as fallback
        return of({
          totalAttempts: 0,
          averageScore: 0,
          completionRate: 0,
          difficulty: 'medium',
          mostDifficultQuestions: [],
          performanceByLanguage: {},
          recentAttempts: []
        });
      })
    );
  }

  // Search and filtering
  searchQuizzes(query: string, filters?: {
    difficulty?: string;
    category?: string;
    language?: string;
    aiGenerated?: boolean;
    validated?: boolean;
  }): Observable<Quiz[]> {
    let params = new HttpParams().set('q', query);
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<Quiz[]>('/api/quizzes/search', { params }).pipe(
      catchError(error => {
        console.error('Search failed, using local filtering:', error);
        // Fallback to local filtering
        return of(this.quizzes().filter(quiz => 
          quiz.title?.toLowerCase().includes(query.toLowerCase()) ||
          quiz.category?.toLowerCase().includes(query.toLowerCase()) ||
          quiz.explanation?.toLowerCase().includes(query.toLowerCase())
        ));
      })
    );
  }

  private getSerializedAnswers(answers: QuizAnswer) {
    return Object.fromEntries(
      Object.entries(answers).map(([key, value]) => [key, Array.from(value)]),
    );
  }

  // Add quiz to the list (for AI generated quizzes)
  addQuizToList(quiz: Quiz): void {
    this.quizzesSignal.update(quizzes => [...quizzes, quiz]);
  }

  // Utility method to validate and clean quiz data
  private validateAndCleanQuiz(quiz: Quiz): Quiz {
    if (!quiz) {
      throw new Error('Quiz is null or undefined');
    }

    // Ensure questions is never null
    if (!quiz.questions) {
      quiz.questions = [];
    }

    // Remove null questions and clean up question data
    quiz.questions = quiz.questions.filter(question => {
      if (!question) {
        console.warn('Removing null question from quiz');
        return false;
      }

      // Ensure answers is never null
      if (!question.answers) {
        question.answers = [];
      }

      // Remove null answers
      question.answers = question.answers.filter(answer => {
        if (!answer) {
          console.warn('Removing null answer from question');
          return false;
        }
        return true;
      });

      return true;
    });

    // Remove duplicate questions based on text
    const seenTexts = new Set<string>();
    quiz.questions = quiz.questions.filter(question => {
      const normalizedText = question.text?.toLowerCase().trim();
      if (!normalizedText || seenTexts.has(normalizedText)) {
        console.warn('Removing duplicate or empty question:', question.text);
        return false;
      }
      seenTexts.add(normalizedText);
      return true;
    });

    return quiz;
  }
}
