import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class UserService {

    getCurrentUserInfo(): any {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    }
}