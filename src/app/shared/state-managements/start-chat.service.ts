import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StartChatService {
    private _show$ = new BehaviorSubject<boolean>(false);
    show$ = this._show$.asObservable();

    private _selected$ = new Subject<any>();
    selected$ = this._selected$.asObservable();

    open() { this._show$.next(true); }
    close() { this._show$.next(false); }

    select(user: any) {
        this._selected$.next(user);
        this.close();
    }
}