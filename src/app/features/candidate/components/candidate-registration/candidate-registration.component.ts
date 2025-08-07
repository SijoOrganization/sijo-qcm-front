import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CandidateService } from '../../services/candidate.service';
import { AlertService } from '../../../../core/alert/services/alert.service';

@Component({
  selector: 'app-candidate-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './candidate-registration.component.html',
  styleUrl: './candidate-registration.component.css'
})
export class CandidateRegistrationComponent implements OnInit {

  registrationForm!: FormGroup;
  isLoading = false;
  
  // Options pour les formulaires
  experienceLevels = [
    { value: 'junior', label: '0-2 ans (Junior)' },
    { value: 'middle', label: '3-5 ans (Intermédiaire)' },
    { value: 'senior', label: '5+ ans (Senior)' }
  ];
  
  programmingLanguages = [
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'php', label: 'PHP' },
    { value: 'go', label: 'Go' }
  ];

  constructor(
    private fb: FormBuilder,
    private candidateService: CandidateService,
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  public initializeForm(): void {
    this.registrationForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      position: ['', [Validators.required, Validators.minLength(3)]],
      company: [''],
      yearsOfExperience: [null, [Validators.required, Validators.min(0), Validators.max(50)]],
      experienceLevel: ['', Validators.required],
      programmingLanguages: [[], [Validators.required, Validators.minLength(1)]],
      preferredLanguage: ['', Validators.required]
    });
  }

  onLanguageChange(language: string, event: any): void {
    const currentLanguages = this.registrationForm.get('programmingLanguages')?.value || [];
    
    if (event.target.checked) {
      if (!currentLanguages.includes(language)) {
        currentLanguages.push(language);
      }
    } else {
      const index = currentLanguages.indexOf(language);
      if (index > -1) {
        currentLanguages.splice(index, 1);
      }
    }
    
    this.registrationForm.get('programmingLanguages')?.setValue(currentLanguages);
  }

  isLanguageSelected(language: string): boolean {
    const selectedLanguages = this.registrationForm.get('programmingLanguages')?.value || [];
    return selectedLanguages.includes(language);
  }

  onSubmit(): void {
    if (this.registrationForm.invalid) {
      this.markFormGroupTouched();
      this.alertService.setMessage({
        type: 'error',
        message: 'Veuillez corriger les erreurs dans le formulaire'
      });
      return;
    }

    this.isLoading = true;
    const formData = this.registrationForm.value;

    this.candidateService.registerCandidate(formData).subscribe({
      next: (candidate: any) => {
        this.alertService.setMessage({
          type: 'success',
          message: 'Inscription réussie ! Vous allez recevoir un email avec les détails du test.'
        });
        // Rediriger vers la page d'attente ou instructions
        this.router.navigate(['/candidate/waiting', candidate._id]);
      },
      error: (error: any) => {
        console.error('Erreur inscription:', error);
        this.alertService.setMessage({
          type: 'error',
          message: error.error?.message || 'Erreur lors de l\'inscription'
        });
        this.isLoading = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registrationForm.controls).forEach(key => {
      const control = this.registrationForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const control = this.registrationForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return `${fieldName} est requis`;
      if (control.errors['email']) return 'Email invalide';
      if (control.errors['minlength']) return `${fieldName} trop court`;
      if (control.errors['pattern']) return `Format ${fieldName} invalide`;
      if (control.errors['min']) return `Valeur trop petite`;
      if (control.errors['max']) return `Valeur trop grande`;
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.registrationForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }
}
