import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Candidate {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  programmingLanguages: string[];
  experienceLevel: 'junior' | 'middle' | 'senior';
  skillLevel: 'beginner' | 'intermediate' | 'advanced'; // Added for level-based assignment
  primaryTechnology?: string; // Main technology focus
  technologies: string[];
  position: string;
  assignedQuizId?: string;
  testStartTime?: string;
  testEndTime?: string;
  testDurationMinutes?: number;
  testStatus: 'not_started' | 'in_progress' | 'completed' | 'expired';
  totalScore?: number;
  maxPossibleScore?: number;
  percentageScore?: number;
  lastTestScore?: number; // Last test score for quick reference
  resultLevel?: 'excellent' | 'good' | 'average' | 'poor';
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  isActive?: boolean;
  notes?: string;
}

export interface TestResult {
  _id?: string;
  candidateId: string;
  quizId: string;
  candidateName: string;
  candidateEmail: string;
  quizTitle: string;
  quizDifficulty: string;
  programmingLanguage: string;
  totalQuestions: number;
  startTime: string;
  endTime: string;
  actualDurationMinutes: number;
  estimatedDurationMinutes: number;
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
  grade: string;
  qcmScore?: number;
  qcmMaxScore?: number;
  fillBlankScore?: number;
  fillBlankMaxScore?: number;
  codingScore?: number;
  codingMaxScore?: number;
  questionResults?: QuestionResult[];
  skillScores?: { [key: string]: number };
  strongSkills?: string[];
  weakSkills?: string[];
  overallFeedback?: string;
  recommendations?: string[];
  hiringRecommendation: 'strongly_recommend' | 'recommend' | 'conditional' | 'not_recommend';
  createdAt?: string;
  evaluatedBy?: string;
  isReviewed?: boolean;
  reviewNotes?: string;
}

export interface QuestionResult {
  questionId: string;
  questionType: string;
  questionText: string;
  candidateAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  timeSpentSeconds: number;
  feedback?: string;
  submittedCode?: string;
  testCaseResults?: TestCaseResult[];
  compilationSuccess?: boolean;
  compilationErrors?: string;
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  errorMessage?: string;
}

export interface RecruitmentStats {
  totalCandidates: number;
  completedTests: number;
  averageScore: number;
  topPerformers: TestResult[];
  recentResults: TestResult[];
}

@Injectable({
  providedIn: 'root'
})
export class CandidateService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.backendUrl}/candidates`;
  
  private candidatesSubject = new BehaviorSubject<Candidate[]>([]);
  public candidates$ = this.candidatesSubject.asObservable();
  
  private testResultsSubject = new BehaviorSubject<TestResult[]>([]);
  public testResults$ = this.testResultsSubject.asObservable();

    // CRUD Operations pour les candidats
  createCandidate(candidate: Candidate): Observable<Candidate> {
    console.log('CandidateService: Creating candidate', candidate);
    return this.http.post<Candidate>(this.baseUrl, candidate).pipe(
      tap(newCandidate => {
        console.log('CandidateService: Candidate created successfully', newCandidate);
        const currentCandidates = this.candidatesSubject.value;
        this.candidatesSubject.next([...currentCandidates, newCandidate]);
      }),
      catchError(error => {
        console.error('CandidateService: Error creating candidate', error);
        return throwError(() => error);
      })
    );
  }

  getAllCandidates(): Observable<Candidate[]> {
    console.log('CandidateService: Fetching all candidates from', this.baseUrl);
    return this.http.get<Candidate[]>(this.baseUrl).pipe(
      tap(candidates => {
        console.log('CandidateService: Fetched candidates successfully', candidates.length, 'candidates');
        this.candidatesSubject.next(candidates);
      }),
      catchError(error => {
        console.error('CandidateService: Error fetching candidates', error);
        this.candidatesSubject.next([]); // Set empty array on error
        return of([]); // Return empty array instead of throwing error
      })
    );
  }

  getCandidateById(candidateId: string): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.baseUrl}/${candidateId}`).pipe(
      catchError(this.handleError)
    );
  }

  getCandidateByEmail(email: string): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.baseUrl}/email/${email}`).pipe(
      catchError(this.handleError)
    );
  }

  getCandidatesByStatus(status: string): Observable<Candidate[]> {
    return this.http.get<Candidate[]>(`${this.baseUrl}/status/${status}`).pipe(
      catchError(this.handleError)
    );
  }

  updateCandidate(candidateId: string, candidate: Candidate): Observable<Candidate> {
    return this.http.put<Candidate>(`${this.baseUrl}/${candidateId}`, candidate).pipe(
      tap(updatedCandidate => {
        const currentCandidates = this.candidatesSubject.value;
        const index = currentCandidates.findIndex(c => c._id === candidateId);
        if (index !== -1) {
          currentCandidates[index] = updatedCandidate;
          this.candidatesSubject.next([...currentCandidates]);
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteCandidate(candidateId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${candidateId}`).pipe(
      tap(() => {
        const currentCandidates = this.candidatesSubject.value;
        const filteredCandidates = currentCandidates.filter(c => c._id !== candidateId);
        this.candidatesSubject.next(filteredCandidates);
      }),
      catchError(this.handleError)
    );
  }

  // Assignment de quiz
  assignQuizToCandidate(candidateId: string, quizId: string): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.baseUrl}/${candidateId}/assign-quiz/${quizId}`, {}).pipe(
      tap(updatedCandidate => {
        const currentCandidates = this.candidatesSubject.value;
        const index = currentCandidates.findIndex(c => c._id === candidateId);
        if (index !== -1) {
          currentCandidates[index] = updatedCandidate;
          this.candidatesSubject.next([...currentCandidates]);
        }
      }),
      catchError(this.handleError)
    );
  }

  getSuggestedQuizForCandidate(candidateId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/${candidateId}/suggested-quiz`).pipe(
      catchError(this.handleError)
    );
  }

  // Gestion des tests
  startTest(candidateId: string): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.baseUrl}/${candidateId}/start-test`, {}).pipe(
      catchError(this.handleError)
    );
  }

  completeTest(candidateId: string, testResult: TestResult): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.baseUrl}/${candidateId}/complete-test`, testResult).pipe(
      catchError(this.handleError)
    );
  }

  evaluateTest(candidateId: string, quizId: string, submissionData: any): Observable<TestResult> {
    return this.http.post<TestResult>(`${this.baseUrl}/${candidateId}/evaluate/${quizId}`, submissionData).pipe(
      catchError(this.handleError)
    );
  }

  // Résultats et statistiques
  getCandidateResults(candidateId: string): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.baseUrl}/${candidateId}/results`).pipe(
      catchError(this.handleError)
    );
  }

  getAllTestResults(): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.baseUrl}/results/all`).pipe(
      tap(results => this.testResultsSubject.next(results)),
      catchError(this.handleError)
    );
  }

  getRecruitmentStats(): Observable<RecruitmentStats> {
    return this.http.get<RecruitmentStats>(`${this.baseUrl}/stats`).pipe(
      catchError(this.handleError)
    );
  }

  getTopPerformers(limit: number = 10): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.baseUrl}/top-performers?limit=${limit}`).pipe(
      catchError(this.handleError)
    );
  }

  getRecentResults(days: number = 7): Observable<TestResult[]> {
    return this.http.get<TestResult[]>(`${this.baseUrl}/results/recent?days=${days}`).pipe(
      catchError(this.handleError)
    );
  }

  // Méthodes utilitaires
  getExperienceLevels(): string[] {
    return ['junior', 'middle', 'senior'];
  }

  getProgrammingLanguages(): string[] {
    return ['Java', 'C#', 'Python', 'JavaScript', 'TypeScript', 'PHP', 'Go', 'Rust'];
  }

  getTestStatuses(): string[] {
    return ['not_started', 'in_progress', 'completed', 'expired'];
  }

  getHiringRecommendations(): { value: string, label: string, color: string }[] {
    return [
      { value: 'strongly_recommend', label: 'Fortement recommandé', color: 'success' },
      { value: 'recommend', label: 'Recommandé', color: 'primary' },
      { value: 'conditional', label: 'Conditionnel', color: 'warning' },
      { value: 'not_recommend', label: 'Non recommandé', color: 'danger' }
    ];
  }

  getGradeColor(grade: string): string {
    switch (grade) {
      case 'A': return 'success';
      case 'B': return 'primary';
      case 'C': return 'warning';
      case 'D': return 'danger';
      case 'F': return 'danger';
      default: return 'secondary';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'not_started': return 'secondary';
      case 'in_progress': return 'warning';
      case 'completed': return 'success';
      case 'expired': return 'danger';
      default: return 'secondary';
    }
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  }

  private handleError(error: any): Observable<never> {
    console.error('CandidateService Error:', error);
    return throwError(() => new Error(error.message || 'Une erreur est survenue'));
  }
}
