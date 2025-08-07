import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CandidateRegistration {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  company?: string;
  yearsOfExperience: number;
  experienceLevel: string;
  programmingLanguages: string[];
  preferredLanguage: string;
}

export interface Candidate {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  company?: string;
  yearsOfExperience: number;
  experienceLevel: string;
  programmingLanguages: string[];
  preferredLanguage: string;
  testStatus: string;
  assignedQuizId?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CandidateService {

  private apiUrl = '/api'; // Utiliser le proxy configuré

  constructor(private http: HttpClient) {}

  /**
   * 📝 Inscrire un nouveau candidat
   */
  registerCandidate(registration: CandidateRegistration): Observable<Candidate> {
    return this.http.post<Candidate>(`${this.apiUrl}/candidates/register`, registration);
  }

  /**
   * 🔍 Obtenir un candidat par email
   */
  getCandidateByEmail(email: string): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.apiUrl}/candidates/email/${email}`);
  }

  /**
   * 🔍 Obtenir un candidat par ID
   */
  getCandidateById(id: string): Observable<Candidate> {
    return this.http.get<Candidate>(`${this.apiUrl}/candidates/${id}`);
  }

  /**
   * 📊 Obtenir les statistiques du candidat
   */
  getCandidateStats(candidateId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/candidates/${candidateId}/stats`);
  }
}
