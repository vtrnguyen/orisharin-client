import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    {
        path: 'auth',
        loadComponent: () => import('./layouts/auth/auth.layout').then(m => m.AuthLayoutComponent),
        children: [
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            },
            {
                path: 'login',
                loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
            },
        ]
    },

    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./layouts/admin/admin.layout').then(m => m.AdminLayoutComponent),
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
        ]
    },

    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layouts/user/user.layout').then(m => m.UserLayoutComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/user/home/home.component').then(m => m.HomeComponent)
            },
        ]
    },

    {
        path: '**',
        loadComponent: () => import('./pages/error/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent)
    }
];