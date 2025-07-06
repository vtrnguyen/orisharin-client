import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../shared/dtos/auth-response.dto';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
    ],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    email: string = "";
    password: string = "";
    error: string = "";

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    onSubmit() {
        this.error = "";
        this.authService.login(this.email, this.password).subscribe({
            next: (response: AuthResponse) => {
                if (response.user.role === 'admin') {
                    this.router.navigate(['/admin']);
                } else {
                    this.router.navigate(['/']);
                }
            },
            error: (err) => {
                this.error = err?.error?.message || 'Đăng nhập thất bại!';
            }
        });
    }
}