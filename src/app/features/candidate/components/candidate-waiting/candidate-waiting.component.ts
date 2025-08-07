import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';

@Component({
  selector: 'app-candidate-waiting',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './candidate-waiting.component.html',
  styleUrl: './candidate-waiting.component.css'
})
export class CandidateWaitingComponent implements OnInit {

  candidateId!: string;
  candidate: any = null;
  isLoading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private candidateService: CandidateService
  ) {}

  ngOnInit(): void {
    this.candidateId = this.route.snapshot.params['candidateId'];
    this.loadCandidateInfo();
  }

  private loadCandidateInfo(): void {
    this.candidateService.getCandidateById(this.candidateId).subscribe({
      next: (candidate) => {
        this.candidate = candidate;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des informations candidat:', error);
        this.isLoading = false;
        // Rediriger vers l'inscription si le candidat n'est pas trouvé
        this.router.navigate(['/candidate/register']);
      }
    });
  }

  public goBackToHome(): void {
    this.router.navigate(['/']);
  }
}
