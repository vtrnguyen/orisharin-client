import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AuthResponse } from '../../../shared/dtos/auth-response.dto';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent {
    email: string = "";
    password: string = "";
    error: string = "";
    isLoading: boolean = false;

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    onSubmit() {
        this.error = "";
        if (!this.email.trim() || !this.password.trim()) {
            this.error = "Vui lòng nhập đầy đủ email và mật khẩu.";
            return;
        }
        this.isLoading = true;
        this.authService.login(this.email, this.password).subscribe({
            next: (response: AuthResponse) => {
                this.isLoading = false;
                if (response.user.role === 'admin') {
                    this.router.navigate(['/admin']);
                } else {
                    this.router.navigate(['/']);
                }
            },
            error: () => {
                this.isLoading = false;
                this.error = "Tên đăng nhập hoặc mật khẩu không chính xác.";
            }
        });
    }
}