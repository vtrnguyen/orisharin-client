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

    updateAvatar(conversationId: string, file: File): Observable<any> {
        const fd = new FormData();
        fd.append('file', file);
        return this.http.patch<any>(`${this.apiUrl}/${conversationId}/avatar`, fd);
    }

    updateName(conversationId: string, name: string): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/${conversationId}/name`, { name });
    }

    updateTheme(conversationId: string, theme: string): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/${conversationId}/theme`, { theme });
    }

    updateQuickEmoji(conversationId: string, quickEmoji: string): Observable<any> {
        return this.http.patch<any>(`${this.apiUrl}/${conversationId}/quick-emoji`, { quickEmoji });
    }

    addParticipants(conversationId: string, userIds: string[]): Observable<any> {
        const body = { userIds: Array.isArray(userIds) ? userIds : [] };
        return this.http.patch<any>(`${this.apiUrl}/${conversationId}/participants`, body);
    }

    removeParticipants(conversationId: string, userIds: string[]) {
        const body = { userIds: Array.isArray(userIds) ? userIds : [] };
        return this.http.patch<any>(`${this.apiUrl}/${conversationId}/participants/remove`, body);
    }

    leaveConversation(conversationId: string) {
        return this.http.patch<any>(`${this.apiUrl}/${conversationId}/leave`, {});
    }
}