import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthResponse } from '../../shared/dtos/auth-response.dto';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = environment.apiUrl + '/auth';
    private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
    currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) { }

    login(email: string, password: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password }).pipe(
            tap(res => this.handleAuth(res))
        );
    }

    register(data: { email: string; password: string; username: string; fullName: string }): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
            tap(res => this.handleAuth(res))
        );
    }

    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('accessToken');
    }

    getToken(): string | null {
        return localStorage.getItem('accessToken');
    }

    getCurrentUser(): any {
        return this.currentUserSubject.value;
    }

    hasRole(role: string): boolean {
        const user = this.getCurrentUser();
        return user?.role === role;
    }

    // Helpers
    private handleAuth(res: AuthResponse) {
        if (res.success) {
            localStorage.setItem('accessToken', res.accessToken);
            localStorage.setItem('user', JSON.stringify(res.user));
            this.currentUserSubject.next(res.user);
        }
    }

    private getUserFromStorage(): any {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}