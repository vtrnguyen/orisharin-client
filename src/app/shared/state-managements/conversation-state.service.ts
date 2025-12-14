import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConversationStateService {
    private conversationSubject = new BehaviorSubject<any | null>(null);
    readonly conversation$: Observable<any | null> = this.conversationSubject.asObservable();

    private actionSubject = new Subject<any>();
    readonly action$: Observable<any> = this.actionSubject.asObservable();

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

    updateLastMessage(msg: any) {
        this.update(curr => {
            if (!curr) return curr;
            return { ...curr, lastMessage: msg };
        });
    }

    emitAction(action: any) {
        try { this.actionSubject.next(action); } catch { }
    }

    clear() {
        this.conversationSubject.next(null);
    }
}