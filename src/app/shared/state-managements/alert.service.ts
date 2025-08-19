import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AlertState } from '../interfaces/alert.interface';

@Injectable({ providedIn: 'root' })
export class AlertService {
    private alertSubject = new BehaviorSubject<AlertState>({
        show: false,
        type: 'success',
        message: '',
        duration: 2500,
        actionLabel: undefined,
        actionRoute: undefined,
    });

    alert$ = this.alertSubject.asObservable();

    show(
        type: 'success' | 'error' | 'warning',
        message: string,
        duration = 2500,
        actionLabel?: string,
        actionRoute?: string
    ) {
        this.alertSubject.next({ show: true, type, message, duration, actionLabel, actionRoute });
    }

    hide() {
        this.alertSubject.next({ ...this.alertSubject.value, show: false, actionLabel: undefined, actionRoute: undefined });
    }
}