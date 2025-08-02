import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root"
})
export class FollowService {
    private apiUrl = environment.apiUrl + '/follows';

    constructor(private http: HttpClient) { }

    follow(followerId: string, followingId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}`, { followerId, followingId });
    }

    unfollow(followerId: string, followingId: string): Observable<any> {
        return this.http.request('delete', this.apiUrl, { body: { followerId, followingId } });
    }

    getFollowers(userId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/followers/${userId}`);
    }

    getFollowing(userId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/following/${userId}`);
    }

    checkFollow(followerId: string, followingId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/check/${followerId}/${followingId}`);
    }
}
