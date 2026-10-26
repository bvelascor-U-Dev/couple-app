import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/sign-in',
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/authenticated-layout/authenticated-layout').then(
        (m) => m.AuthenticatedLayoutPage,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page').then((m) => m.DashboardPage),
      },
      {
        path: 'finance',
        loadComponent: () =>
          import('./features/finance/pages/finance-page').then((m) => m.FinancePage),
      },
      {
        path: 'goals-habits',
        loadComponent: () =>
          import('./features/goals-habits/pages/goals-page').then((m) => m.GoalsPage),
      },
      {
        path: 'plans-hobbies',
        loadComponent: () =>
          import('./features/hobbies-plans/pages/hobbies-plans-page').then(
            (m) => m.HobbiesPlansPage,
          ),
      },
      {
        path: 'projects-trips',
        loadComponent: () =>
          import('./features/Projects/pages/project-page').then((m) => m.ProjectPage),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/pages/profile-page').then((m) => m.ProfilePage),
      },
      {
        path: 'couple-space',
        loadComponent: () =>
          import('./features/couple-space/pages/couple-space-page/couple-space-page').then(
            (m) => m.CoupleSpacePage,
          ),
      },
    ],
  },
  {
    path: 'auth',
    loadComponent: () =>
      import('./core/layout/public-layout/public-layout').then((m) => m.PublicLayoutPage),
    children: [
      {
        path: 'sign-in',
        loadComponent: () =>
          import('./features/auth/pages/sign-in-page/sign-in-page').then((m) => m.SignInPage),
      },
      {
        path: 'sign-up',
        loadComponent: () =>
          import('./features/auth/pages/sign-up-page/sign-up-page').then((m) => m.SignUpPage),
      },
      {
        path: '',
        redirectTo: 'sign-in',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'auth/sign-in',
  },
];
