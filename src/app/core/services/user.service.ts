import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { ApiResponse } from "../../shared/dtos/api-response.dto";
import { Observable } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class UserService {
    private apiUrl = environment.apiUrl + '/users';

    constructor(
        private http: HttpClient
    ) { }

    getCurrentUserInfo(): any {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }

    getUserProfile(userId: string): Observable<ApiResponse<any>> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${userId}`);
    }

    updateUserProfile(
        data: {
            bio?: string;
            websiteLinks?: string[];
            avatar?: File;
        }
    ): Observable<ApiResponse<any>> {
        const formData = new FormData();
        if (data.bio !== undefined) formData.append("bio", data.bio);

        if (data.websiteLinks) {
            if (data.websiteLinks.length === 0) {
                formData.append("websiteLinks", "");
            } else {
                data.websiteLinks.forEach(url => formData.append("websiteLinks", url));
            }
        }

        if (data.avatar !== undefined && data.avatar !== null) {
            formData.append("avatar", data.avatar);
        }

        return this.http.patch<ApiResponse<any>>(`${this.apiUrl}/profile`, formData);
    }
}