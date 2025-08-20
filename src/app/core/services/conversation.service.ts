import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
}