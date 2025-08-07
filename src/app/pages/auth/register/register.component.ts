import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

    constructor(private router: Router) { }

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
    }
}