import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = environment.apiUrl + '/notifications';

    constructor(private http: HttpClient) { }

    getMyNotifications(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/me`);
    }

    markAsRead(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/read`, {});
    }

    markAllAsRead(): Observable<any> {
        return this.http.patch(`${this.apiUrl}/me/read-all`, {});
    }
}