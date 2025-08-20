import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConversationService {
    private apiUrl = environment.apiUrl + '/conversations';

    constructor(private http: HttpClient) { }

    create(body: { participantIds: string[]; isGroup?: boolean; name?: string }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}`, body);
    }

    getByUser(userId: String, page = 1, limit = 10): Observable<any> {
        const params = new HttpParams()
            .set("page", String(page))
            .set("limit", String(limit));

        return this.http.get<any>(`${this.apiUrl}/user/${userId}`, { params });
    }

    getById(conversationId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${conversationId}`);
    }
}