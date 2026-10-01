import { Routes } from '@angular/router';

export const routes: Routes = [{

    path: '',
    loadComponent: () => import('./core/layout/authenticated-layout/authenticated-layout').then(m => m.AuthenticatedLayoutPage),
    children: [
        {
            path: 'dashboard',
            loadComponent: () => import('./features/dashboard/pages/dashboard-page').then(m => m.DashboardPage),
        }
    ]
        
}];
