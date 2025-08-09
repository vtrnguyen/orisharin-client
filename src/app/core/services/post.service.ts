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
        files?: File[];
        privacy?: 'public' | 'followers' | 'private';
        originalPostId?: string;
        sharedFromPostId?: string;
    }): Observable<any> {
        const formData = new FormData();
        formData.append('content', data.content);
        if (data.privacy) formData.append('privacy', data.privacy);
        if (data.originalPostId) formData.append('originalPostId', data.originalPostId);
        if (data.sharedFromPostId) formData.append('sharedFromPostId', data.sharedFromPostId);
        if (data.files && data.files.length > 0) {
            data.files.forEach(file => formData.append('files', file));
        }
        return this.http.post<any>(`${this.apiUrl}`, formData);
    }

    getAllPosts(): Observable<any> {
        return this.http.get<Post>(`${this.apiUrl}`);
    }

    getPostsPaginated(page: number = 1, limit: number = 10): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}?page=${page}&limit=${limit}`);
    }

    getPostById(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${id}`);
    }

    getPostByUsername(username: string): Observable<Post[]> {
        return this.http.get<Post[]>(`${this.apiUrl}/user/${username}`);
    }
}
