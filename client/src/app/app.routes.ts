import { Routes } from '@angular/router';
import { LoginComponent } from './core/features/login/login.component';
import { DashboardComponent } from './core/features/dashboard/dashboard.component';
import { ResultsComponent } from './core/features/results/results.component';
import { GlobalResultsComponent } from './core/features/global-results/global-results.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const appRoutes: Routes = [
    { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
    { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
    { path: 'results', component: ResultsComponent },
    { path: 'global-results', component: GlobalResultsComponent },
    { path: '**', redirectTo: 'login', pathMatch: 'full' }
];
