import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
    providedIn: "root",
})
export class CommentEventService {
    private commentCreatedSource = new Subject<any>();
    commentCreated$ = this.commentCreatedSource.asObservable();

    emitCommentCreated(comment: any) {
        this.commentCreatedSource.next(comment);
    }
}
