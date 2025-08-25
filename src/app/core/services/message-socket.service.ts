import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Observable, Subject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MessageSocketService {
    private socket?: Socket;
    private msgCreated$ = new Subject<any>();
    private msgDeleted$ = new Subject<any>();
    private msgReacted$ = new Subject<any>();
    private error$ = new Subject<any>();

    constructor(
        private auth: AuthService,
        private ngZone: NgZone
    ) { }

    connect() {
        if (this.socket && this.socket.connected) return;

        const token = this.auth.getToken();
        const url = environment.socketUrl;

        this.socket = io(url, {
            auth: { token },
            query: { token },
            transports: ['websocket', 'polling'],
            withCredentials: true
        });

        this.socket.on('connect', () => {
            console.debug('Socket connected', this.socket?.id);
        });

        this.socket.on('message:created', (msg: any) => {
            this.ngZone.run(() => this.msgCreated$.next(msg));
        });

        this.socket.on('message:deleted', (msg: any) => {
            this.ngZone.run(() => this.msgDeleted$.next(msg));
        });

        this.socket.on("message:reacted", (msg: any) => {
            this.ngZone.run(() => this.msgReacted$.next(msg?.payload ?? msg));
        })

        this.socket.on('message:error', (err: any) => {
            this.ngZone.run(() => this.error$.next(err));
        });

        this.socket.on('disconnect', (reason: any) => {
            console.debug('Socket disconnected', reason);
        });
    }

    disconnect() {
        if (!this.socket) return;
        this.socket.disconnect();
        this.socket = undefined;
    }

    onMessageCreated(): Observable<any> {
        return this.msgCreated$.asObservable();
    }

    onMessageDeleted(): Observable<{ id: string }> {
        return this.msgDeleted$.asObservable();
    }

    onMessageReacted(): Observable<any> {
        return this.msgReacted$.asObservable();
    }

    onError(): Observable<any> {
        return this.error$.asObservable();
    }

    sendMessage(payload: { conversationId: string; content?: string; mediaUrls?: string[] }) {
        if (!this.socket || !this.socket.connected) {
            console.warn('Socket not connected; message not sent');
            return;
        }
        this.socket.emit('message:send', payload);
    }

    isConnected(): boolean {
        return !!this.socket && this.socket.connected;
    }
}