import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
        return true;
    }

    if (auth.hasRole('admin')) {
        router.navigate(['/admin']);
        return false;
    }

    router.navigate(['/']);
    return false;
};