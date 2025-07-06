import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { inject } from '@angular/core';

export const adminGuard: CanActivateFn = () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (!auth.isLoggedIn()) {
        router.navigate(['/auth/login']);
        return false;
    }

    if (!auth.hasRole('admin')) {
        router.navigate(['/']);
        return false;
    }

    return true;
};