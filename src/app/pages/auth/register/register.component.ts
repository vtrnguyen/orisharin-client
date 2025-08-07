import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
    fullName: string = '';
    userName: string = '';
    email: string = '';
    password: string = '';
    confirmPassword: string = '';
    error: string = '';
    isLoading: boolean = false;

    constructor(
        private router: Router,
        private authService: AuthService,
    ) { }

    onSubmit() {
        this.error = '';
        if (!this.fullName.trim() || !this.userName.trim() || !this.email.trim() || !this.password.trim() || !this.confirmPassword.trim()) {
            this.error = 'Vui lòng nhập đầy đủ thông tin.';
            return;
        }
        if (this.password !== this.confirmPassword) {
            this.error = 'Mật khẩu xác nhận không khớp.';
            return;
        }

        this.isLoading = true;
        this.authService.register({ email: this.email, password: this.password, username: this.userName, fullName: this.fullName }).subscribe({
            next: (response) => {
                this.isLoading = false;
                if (response && response.success) {
                    if (response.user.role === 'admin') {
                        this.router.navigate(['/admin']);
                    } else if (response.user.role === 'user') {
                        this.router.navigate(['/']);
                    }
                } else {
                    this.isLoading = false;
                    this.error = 'Thông tin tài khoản đã tồn tại.';
                }
            },
            error: () => {
                this.isLoading = false;
                this.error = 'Thông tin tài khoản đã tồn tại.';
            }
        })
    }
}