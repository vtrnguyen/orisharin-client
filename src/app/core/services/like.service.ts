import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LikeTargetType } from '../../shared/enums/like-target.enum';

@Injectable({
    providedIn: 'root'
})
export class LikeService {
    private apiUrl = environment.apiUrl + '/likes';

    constructor(private http: HttpClient) { }

    like(targetId: string, type: LikeTargetType): Observable<any> {
        return this.http.post(this.apiUrl, { targetId, type });
    }

    unlike(targetId: string, type: LikeTargetType): Observable<any> {
        return this.http.request('delete', this.apiUrl, { body: { targetId, type } });
    }

    getLikes(targetId: string, type: LikeTargetType): Observable<{ count: number, likedByUser: boolean, likes: any[] }> {
        return this.http.get<{ count: number, likedByUser: boolean, likes: any[] }>(
            `${this.apiUrl}?targetId=${targetId}&type=${type}`
        );
    }
}