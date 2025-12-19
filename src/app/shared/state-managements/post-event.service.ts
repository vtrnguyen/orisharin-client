import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class PostEventService {
    private postCreatedSource = new Subject<void>();
    postCreated$ = this.postCreatedSource.asObservable();

    emitPostCreated(post?: any) {
        this.postCreatedSource.next(post);
    }
}
