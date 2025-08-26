import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConversationStateService {
    private conversationSubject = new BehaviorSubject<any | null>(null);
    readonly conversation$: Observable<any | null> = this.conversationSubject.asObservable();

    setConversation(conv: any | null) {
        this.conversationSubject.next(conv ?? null);
    }

    getCurrent(): any | null {
        return this.conversationSubject.getValue();
    }

    update(fn: (curr: any | null) => any | null) {
        const curr = this.getCurrent();
        const next = fn(curr);
        this.conversationSubject.next(next ?? null);
    }

    updateName(name: string) {
        this.update(curr => {
            if (!curr) return curr;
            return { ...curr, name: String(name ?? '').trim() };
        });
    }

    clear() {
        this.conversationSubject.next(null);
    }
}