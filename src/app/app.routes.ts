import { Routes } from '@angular/router';
import { AuthService } from './core/auth/services/auth.service';
import { inject } from '@angular/core';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { TutorGuard } from './core/auth/guards/tutor.guard';
import { HomeComponent } from './core/layout/home/home.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'candidate',
    pathMatch: 'full',
  },
  {
    path: 'home',
    component: HomeComponent,
  },
  {
    path: 'auth',
    children: [
      {
        path: 'signin',
        loadComponent: () =>
          import('./core/auth/components/auth-page/auth-page.component').then(
            (m) => m.AuthPageComponent,
          ),
      },
      {
        path: 'signup',
        loadComponent: () =>
          import('./core/auth/components/auth-page/auth-page.component').then(
            (m) => m.AuthPageComponent,
          ),
      },
    ],
    canActivate: [() => !inject(AuthService).isAuthenticated()],
  },
  // 🎯 ADMIN ZONE - Seule zone pour créer des quiz
  {
    path: 'admin',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/admin/components/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent,
          ),
        canActivate: [AuthGuard, TutorGuard],
      },
    ],
  },
  // 🎯 CANDIDATE ZONE - Espace candidat pour s'inscrire et passer des quiz
  {
    path: 'candidate',
    children: [
      {
        path: '',
        redirectTo: 'register',
        pathMatch: 'full',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/candidate/components/candidate-registration/candidate-registration.component').then(
            (m) => m.CandidateRegistrationComponent,
          ),
      },
      {
        path: 'waiting/:candidateId',
        loadComponent: () =>
          import('./features/candidate/components/candidate-waiting/candidate-waiting.component').then(
            (m) => m.CandidateWaitingComponent,
          ),
      },
      {
        path: 'quiz-instructions/:sessionId',
        loadComponent: () =>
          import('./features/candidate/components/quiz-instructions/quiz-instructions.component').then(
            (m) => m.QuizInstructionsComponent,
          ),
      },
      {
        path: 'quiz-taking/:sessionId',
        loadComponent: () =>
          import('./features/candidate/components/quiz-taking/quiz-taking.component').then(
            (m) => m.QuizTakingComponent,
          ),
      },
      {
        path: 'quiz/:sessionId',
        loadComponent: () =>
          import('./features/candidate/components/quiz-taking/quiz-taking.component').then(
            (m) => m.QuizTakingComponent,
          ),
      },
      {
        path: 'quiz-results/:sessionId',
        loadComponent: () =>
          import('./features/candidate/components/quiz-results/quiz-results.component').then(
            (m) => m.QuizResultsComponent,
          ),
      },
      {
        path: 'results/:sessionId',
        loadComponent: () =>
          import('./features/candidate/components/quiz-results/quiz-results.component').then(
            (m) => m.QuizResultsComponent,
          ),
      },
    ],
  },
  // 🎯 PLATFORM ZONE - Plateforme de test pour utilisateurs connectés
  {
    path: 'platform',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/quiz/components/platform-dashboard/platform-dashboard.component').then(
            (m) => m.PlatformDashboardComponent,
          ),
      },
      {
        path: 'practice',
        loadComponent: () =>
          import('./features/quiz/components/practice-mode-new/practice-mode-new.component').then(
            (m) => m.PracticeModeComponent,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'quiz/:id',
        loadComponent: () =>
          import('./features/quiz/components/quiz-info/quiz-info.component').then(
            (m) => m.QuizInfoComponent,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'quiz/:id/take',
        loadComponent: () =>
          import('./features/quiz/components/quiz-taker/quiz-taker.component').then(
            (m) => m.QuizTakerComponent,
          ),
        canActivate: [AuthGuard],
      },
      {
        path: 'results/:id',
        loadComponent: () =>
          import('./features/quiz/components/submission/submission.component').then(
            (m) => m.SubmissionComponent,
          ),
        canActivate: [AuthGuard],
      },
    ],
  },
];
