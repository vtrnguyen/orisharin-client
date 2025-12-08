import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Observable, Subject, BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class NotificationSocketService {
    private socket?: Socket;
    private notificationReceived$ = new Subject<any>();
    private connected$ = new BehaviorSubject<boolean>(false);
    private error$ = new Subject<any>();

    constructor(
        private authService: AuthService,
        private ngZone: NgZone
    ) { }

    connect() {
        if (this.socket && this.socket.connected) return;

        const token = this.authService.getToken();
        if (!token) {
            return;
        }

        const url = environment.socketUrl;

        this.socket = io(url, {
            auth: { token },
            query: { token },
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        this.socket.on('connect', () => {
            this.ngZone.run(() => this.connected$.next(true));

            // join notification room
            this.socket?.emit('notification:join');
        });

        this.socket.on('notification:joined', (data: any) => {
            // joining room success
        });

        this.socket.on('notification:received', (notification: any) => {
            this.ngZone.run(() => this.notificationReceived$.next(notification));
        });

        this.socket.on('disconnect', (reason: any) => {
            this.ngZone.run(() => this.connected$.next(false));
        });

        this.socket.on('connect_error', (error: any) => {
            this.ngZone.run(() => this.error$.next(error));
        });

        this.socket.on('error', (error: any) => {
            this.ngZone.run(() => this.error$.next(error));
        });
    }

    disconnect() {
        if (!this.socket) return;
        this.socket.disconnect();
        this.socket = undefined;
        this.connected$.next(false);
    }

    onNotificationReceived(): Observable<any> {
        return this.notificationReceived$.asObservable();
    }

    onConnected(): Observable<boolean> {
        return this.connected$.asObservable();
    }

    onError(): Observable<any> {
        return this.error$.asObservable();
    }

    isConnected(): boolean {
        return !!this.socket && this.socket.connected;
    }

    // to manually join notification room (if needed)
    joinNotificationRoom() {
        if (this.socket && this.socket.connected) {
            this.socket.emit('notification:join');
        }
    }
}
