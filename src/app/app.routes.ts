import { Routes } from '@angular/router';
import { AuthService } from './core/auth/services/auth.service';
import { inject } from '@angular/core';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { TutorGuard } from './core/auth/guards/tutor.guard';
import { HomeComponent } from './core/layout/home/home.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'platform',
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
  {
    path: 'platform',
    loadComponent: () =>
      import('./features/quiz/components/platform-dashboard/platform-dashboard.component').then(
        (m) => m.PlatformDashboardComponent,
      ),
  },
  {
    path: 'quizzes',
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/quiz/components/quiz-list/quiz-list.component'
          ).then((m) => m.QuizListComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import(
            './features/quiz/components/quiz-edit/quiz-edit.component'
          ).then((m) => m.QuizEditComponent),
        canActivate: [AuthGuard, TutorGuard],
      },
      {
        path: 'ai-generator',
        loadComponent: () =>
          import(
            './features/quiz/components/ai-quiz-generator/ai-quiz-generator.component'
          ).then((m) => m.AIQuizGeneratorComponent),
        canActivate: [AuthGuard, TutorGuard],
      },
      {
        path: 'practice',
        loadComponent: () =>
          import(
            './features/quiz/components/practice-mode-new/practice-mode-new.component'
          ).then((m) => m.PracticeModeComponent),
        canActivate: [AuthGuard],
      },
      {
        path: 'question-bank',
        loadComponent: () =>
          import(
            './features/quiz/components/question-bank/question-bank.component'
          ).then((m) => m.QuestionBankComponent),
        canActivate: [AuthGuard, TutorGuard],
      },
      {
        path: ':id',
        loadComponent: () =>
          import(
            './features/quiz/components/quiz-info/quiz-info.component'
          ).then((m) => m.QuizInfoComponent),
        canActivate: [AuthGuard],
      },
      {
        path: ':id/take',
        loadComponent: () =>
          import(
            './features/quiz/components/quiz-taker/quiz-taker.component'
          ).then((m) => m.QuizTakerComponent),
        canActivate: [AuthGuard],
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import(
            './features/quiz/components/quiz-edit/quiz-edit.component'
          ).then((m) => m.QuizEditComponent),
        canActivate: [AuthGuard, TutorGuard],
      },
    ],
  },
  {
    path: 'submissions',
    children: [
      {
        path: ':id',
        loadComponent: () =>
          import(
            './features/quiz/components/submission/submission.component'
          ).then((m) => m.SubmissionComponent),
      },
    ],
    canActivate: [AuthGuard],
  },
  {
    path: 'coding-questions',
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/coding-questions/components/coding-questions-list/coding-questions-list.component'
          ).then((m) => m.CodingQuestionsListComponent),
      },
      {
        path: 'create',
        loadComponent: () =>
          import(
            './features/coding-questions/components/coding-question-edit/coding-question-edit.component'
          ).then((m) => m.CodingQuestionEditComponent),
        canActivate: [AuthGuard, TutorGuard],
      },
      {
        path: ':id/edit',
        loadComponent: () =>
          import(
            './features/coding-questions/components/coding-question-edit/coding-question-edit.component'
          ).then((m) => m.CodingQuestionEditComponent),
        canActivate: [AuthGuard, TutorGuard],
      },
      {
        path: ':id',
        loadComponent: () =>
          import(
            './features/coding-questions/components/coding-question-start/coding-question-start.component'
          ).then((m) => m.CodingQuestionStartComponent),
      },
    ],
    canActivate: [AuthGuard],
  },
  {
    path: 'quiz-space',
    loadComponent: () =>
      import('./features/quiz/components/quiz-space/quiz-space.component').then(
        (m) => m.QuizSpaceComponent,
      ),
  },
  {
    path: 'quiz-space/take/:id',
    loadComponent: () =>
      import(
        './features/quiz/components/quiz-space-taker/quiz-space-taker.component'
      ).then((m) => m.QuizSpaceTakerComponent),
  },
];
