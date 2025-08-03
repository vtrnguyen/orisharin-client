import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class CommentService {
    private apiUrl = environment.apiUrl + '/comments';

    constructor(private http: HttpClient) { }

    createComment(data: { postId?: string; parentId?: string; authorId: string; content: string }, files: File[] = []): Observable<any> {
        const formData = new FormData();
        if (data.postId) formData.append('postId', data.postId);
        if (data.parentId) formData.append('parentId', data.parentId);
        formData.append('authorId', data.authorId);
        formData.append('content', data.content);
        files.forEach(file => formData.append("files", file));
        return this.http.post(this.apiUrl, formData);
    }

    getCommentByPost(postId: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/post/${postId}`);
    }

    getCommentById(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/${id}`);
    }
}
