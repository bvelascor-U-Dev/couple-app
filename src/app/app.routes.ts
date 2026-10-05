import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'auth/sign-in',
    },
    {
        path: 'app',
        loadComponent: () => import('./core/layout/authenticated-layout/authenticated-layout').then(m => m.AuthenticatedLayoutPage),
        children: 
        [
            {
                path: '',
                pathMatch: 'full',
                redirectTo: 'dashboard',
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/pages/dashboard-page').then(m => m.DashboardPage),
            },
            {
                path: 'finance',
                loadComponent: () => import('./features/finance/pages/finance-page').then(m => m.FinancePage),
            },
            {
                path: 'goals-habits',
                loadComponent: () => import('./features/goals-habits/pages/goals-page').then(m => m.GoalsPage),
            },
            { 
                path:'plans-hobbies',
                loadComponent: () => import('./features/hobbies-plans/pages/hobbies-plans-page').then(m => m.HobbiesPlansPage)            
            },
            {
                path: 'projects-trips',
                loadComponent: () => import('./features/Projects/pages/project-page').then(m => m.ProjectPage),
            }
        ],
    },
    {
        path: 'auth',
        loadComponent: () => import('./core/layout/public-layout/public-layout').then(m => m.PublicLayoutPage),
        children:
        [
            {
                path: 'sign-in',
                loadComponent: () => import('./features/auth/pages/sign-in-page/sign-in-page').then(m => m.SignInPage)
            },
            {
                path: 'sign-up',
                loadComponent: () => import('./features/auth/pages/sign-up-page/sign-up-page').then(m => m.SignUpPage)
            },
            {
                path: '',
                redirectTo: 'sign-in',
                pathMatch: 'full'
            }
        ]
    },
    {
        path: '**',
        redirectTo: 'auth/sign-in', 
    }


];
