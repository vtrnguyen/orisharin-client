import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AlertState } from '../interfaces/alert.interface';

@Injectable({ providedIn: 'root' })
export class AlertService {
    private alertSubject = new BehaviorSubject<AlertState>({
        show: false,
        type: 'success',
        message: '',
        duration: 2500
    });

    alert$ = this.alertSubject.asObservable();

    show(type: 'success' | 'error' | 'warning', message: string, duration = 2500) {
        this.alertSubject.next({ show: true, type, message, duration });
    }

    hide() {
        this.alertSubject.next({ ...this.alertSubject.value, show: false });
    }
}