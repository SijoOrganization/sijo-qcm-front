import { HttpClient, HttpParams } from '@angular/common/http';
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  CodeExecution,
  CodeExecutionResult,
  CodingQuestion,
  CodingSubmission,
} from '../../../shared/models/codingQuestion.model';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CodingQuestionsService {
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private readonly codingQuestionsSignal = signal<CodingQuestion[]>([]);
  readonly codingQuestions = this.codingQuestionsSignal.asReadonly();

  fetchCodingQuestions() {
    this.http.get<CodingQuestion[]>('/coding-questions')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (codingQuestions) => {
          this.codingQuestionsSignal.set(codingQuestions);
        },
        error: (error) => {
          console.error('Error fetching coding questions:', error);
        }
      });
  }

  getCodingQuestion(codingQuestionId: string): Observable<CodingQuestion> {
    const codingQuestion = this.codingQuestions().find(
      (question) => question.id === codingQuestionId,
    );
    if (codingQuestion) {
      return of(codingQuestion);
    } else {
      return this.fetchCodingQuestion(codingQuestionId);
    }
  }

  fetchCodingQuestion(codingQuestionId: string) {
    return this.http.get<CodingQuestion>(
      `/coding-questions/${codingQuestionId}`,
    );
  }

  submitCodingQuestion(
    questionId: string,
    language: string,
    userCode: string,
  ): Observable<CodingSubmission> {
    return this.http.post<CodingSubmission>('/coding-questions/submit', {
      questionId,
      language,
      userCode,
    });
  }

  fetchAllSubmissionsByQuestion(
    codingQuestionId: string,
  ): Observable<CodingSubmission[]> {
    return this.http.get<CodingSubmission[]>(
      `/coding-questions/${codingQuestionId}/submissions`,
    );
  }
  fetchCodeSubmission(submissionId: String): Observable<CodingSubmission> {
    return this.http.get<CodingSubmission>(
      `/coding-questions/submissions/${submissionId}`,
    );
  }
  executeCode(
    code: string,
    language: string,
    input: string,
  ): Observable<CodeExecutionResult> {
    return this.http.post<CodeExecutionResult>('/coding-questions/execute', {
      code,
      language,
      input,
    } as CodeExecution);
  }

  createCodingQuestion(
    codingQuestion: CodingQuestion,
  ): Observable<CodingQuestion> {
    return this.http.post<CodingQuestion>('/coding-questions', codingQuestion);
  }

  updateCodingQuestion(
    codingQuestion: CodingQuestion,
  ): Observable<CodingQuestion> {
    return this.http.put<CodingQuestion>(
      `/coding-questions/${codingQuestion.id}`,
      codingQuestion,
    );
  }
  deleteCodingQuestion(codingQuestion: CodingQuestion): Observable<any> {
    return this.http.delete(`/coding-questions/${codingQuestion.id}`);
  }
  generateQuestion(topics: string) {
    const params = new HttpParams().set('topics', topics);
    return this.http.get<CodingQuestion>('/coding-questions/generate', {
      params,
    });
  }
}
