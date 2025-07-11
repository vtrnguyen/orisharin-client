import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Post } from "../../shared/interfaces/post.interface";

@Injectable({
    providedIn: "root"
})
export class PostService {
    private apiUrl = environment.apiUrl + '/posts';

    constructor(
        private http: HttpClient
    ) { }

    createPost(data: {
        content: string;
        mediaUrls?: string[];
        privacy?: 'public' | 'friends' | 'private';
        originalPostId?: string;
        sharedFromPostId?: string;
    }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}`, data);
    }

    getAllPosts(): Observable<any> {
        return this.http.get<Post>(`${this.apiUrl}`);
    }

    getPostById(id: string): Observable<Post> {
        return this.http.get<Post>(`${this.apiUrl}/${id}`);
    }
}
