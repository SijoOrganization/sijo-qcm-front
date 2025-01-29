import { inject, Injectable, signal } from '@angular/core';
import { Quiz, QuizAnswer } from '../../../shared/models/quiz.model';
// import { SampleQuiz } from '../mocks/quiz.mock';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { SubmissionConfirmation } from '../../../shared/models/submission.model';

@Injectable({
  providedIn: 'root',
})
export class QuizService {
  http = inject(HttpClient);
  quizzesSignal = signal<Quiz[]>([]);
  quizzes = this.quizzesSignal.asReadonly();

  submit(
    answers: QuizAnswer,
    quizId: string,
  ): Observable<SubmissionConfirmation> {
    return this.http.post<SubmissionConfirmation>('/submissions', {
      answers: this.getSerializedAnswers(answers),
      quizId,
    });
  }

  fetchQuizzes(): void {
    this.http
      .get<Quiz[]>('/quizzes')
      .pipe(
        tap((quizzes) => {
          this.quizzesSignal.set(quizzes);
        }),
      )
      .subscribe({
        error: (err) => console.error('Error loading quizzes:', err),
      });
  }

  fetchFullQuizById(quizId: string): Observable<Quiz> {
    return this.http.get<Quiz>(`/quizzes/${quizId}`);
  }

  generateQuiz(topics: string, nbQuestions: string) {
    const params = new HttpParams()
      .set('topics', topics)
      .set('nbQuestions', nbQuestions);
    return this.http.get<Quiz>('/quizzes/generate', { params });
  }
  fetchQuizInfo(quizId: string): Observable<Quiz> {
    const quiz = this.quizzes().find((quiz) => quiz._id === quizId);
    if (quiz) {
      return of(quiz);
    }
    return this.http.get<Quiz>(`/quizzes/${quizId}?type=info`);
  }

  fetchQuizWithQuestions(quizId: string): Observable<Quiz> {
    return this.http.get<Quiz>(`/quizzes/${quizId}?type=questions`);
  }

  createQuiz(quiz: Quiz): Observable<Quiz> {
    return this.http.post<Quiz>('/quizzes', quiz);
  }

  updateQuiz(quiz: Quiz): Observable<Quiz> {
    return this.http.put<Quiz>(`/quizzes/${quiz._id}`, quiz);
  }

  deleteQuiz(quiz: Quiz): Observable<any> {
    return this.http.delete(`/quizzes/${quiz._id}`);
  }

  private getSerializedAnswers(answers: QuizAnswer) {
    return Object.fromEntries(
      Object.entries(answers).map(([key, value]) => [key, Array.from(value)]),
    );
  }
}
