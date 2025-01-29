import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable } from 'rxjs';
import { Submission } from '../../../shared/models/submission.model';
import { QuizAnswer } from '../../../shared/models/quiz.model';

@Injectable({
  providedIn: 'root',
})
export class SubmissionService {
  http = inject(HttpClient);

  constructor() {}

  fetchSubmissionsIdList(quizId: string): Observable<Submission[]> {
    return this.http.get<Submission[]>(`/quizzes/${quizId}/submissions`);
  }

  fetchSubmission(submissionId: String): Observable<Submission> {
    return this.http.get<any>(`/submissions/${submissionId}`).pipe(
      map((submission) => {
        submission.answers = this.transformToQuizAnswer(submission.answers);
        submission.correctAnswers = this.transformToQuizAnswer(
          submission.correctAnswers,
        );
        return submission;
      }),
      catchError((err) => {
        throw 'Error while fetching /submissions ' + err;
      }),
    );
  }
  private transformToQuizAnswer(input: Record<string, string[]>): QuizAnswer {
    const quizAnswer: QuizAnswer = {};

    for (const [questionId, answers] of Object.entries(input)) {
      quizAnswer[questionId] = new Set(answers);
    }

    return quizAnswer;
  }
}
