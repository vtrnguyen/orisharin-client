import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject, Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationSocketService } from './notification-socket.service';
import { AlertService } from '../../shared/state-managements/alert.service';
import { AuthService } from './auth.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService implements OnDestroy {
    private apiUrl = environment.apiUrl + '/notifications';
    private newNotification$ = new Subject<any>();
    private notificationCount$ = new BehaviorSubject<number>(0);

    private socketSub?: Subscription;
    private authSub?: Subscription;
    private pollingSub?: Subscription;
    private subscribedToSocket = false;

    constructor(
        private http: HttpClient,
        private notificationSocket: NotificationSocketService,
        private alertService: AlertService,
        private authService: AuthService,
    ) {
        const maybeAuthObs: any =
            (this.authService as any).authState$ ??
            (this.authService as any).user$ ??
            (this.authService as any).authChanged$;

        if (maybeAuthObs && typeof maybeAuthObs.subscribe === 'function') {
            this.authSub = maybeAuthObs.subscribe((val: any) => {
                const isLoggedIn = typeof val === 'boolean' ? val : !!val;
                if (isLoggedIn) {
                    this.initializeNotificationCount();
                    this.initializeSocket();
                } else {
                    this.notificationSocket.disconnect();
                }
            });
        } else {
            if (this.authService.isLoggedIn && this.authService.isLoggedIn()) {
                this.initializeNotificationCount();
                this.initializeSocket();
            } else {
                this.startTokenPolling();
            }
        }
    }

    ngOnDestroy() {
        this.notificationSocket.disconnect();
        this.socketSub?.unsubscribe();
        this.authSub?.unsubscribe();
        this.pollingSub?.unsubscribe();
    }

    private startTokenPolling() {
        if (this.pollingSub && !this.pollingSub.closed) return;

        this.pollingSub = interval(500).subscribe(() => {
            const token = (this.authService as any).getToken ? (this.authService as any).getToken() : null;
            const loggedIn = this.authService.isLoggedIn ? this.authService.isLoggedIn() : !!token;
            if (loggedIn || token) {
                this.pollingSub?.unsubscribe();
                this.pollingSub = undefined;
                this.initializeNotificationCount();
                this.initializeSocket();
            }
        });
    }

    initializeSocket() {
        if (this.notificationSocket.isConnected()) return;

        this.notificationSocket.connect();

        if (!this.subscribedToSocket) {
            this.subscribedToSocket = true;
            this.socketSub = this.notificationSocket.onNotificationReceived().subscribe(notification => {
                try {
                    this.alertService.show('success', `${this.getNotificationMessage(notification)}`);
                } catch (e) { }
                this.newNotification$.next(notification);
                this.updateNotificationCount();
            });
        }
    }

    private updateNotificationCount() {
        this.getMyNotifications().subscribe({
            next: (resp: any) => {
                const notificationsArray = Array.isArray(resp)
                    ? resp
                    : (resp?.data ?? resp?.payload ?? []);
                const unread = (notificationsArray || []).filter((n: any) => !n.isRead).length;
                this.notificationCount$.next(unread);
            },
            error: () => { }
        });
    }

    onNewNotification(): Observable<any> {
        return this.newNotification$.asObservable();
    }

    getNotificationCount(): Observable<number> {
        return this.notificationCount$.asObservable();
    }

    initializeNotificationCount() {
        this.updateNotificationCount();
    }

    getMyNotifications(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/me`);
    }

    markAsRead(id: string): Observable<any> {
        return this.http.patch(`${this.apiUrl}/${id}/read`, {});
    }

    markAllAsRead(): Observable<any> {
        return this.http.patch(`${this.apiUrl}/me/read-all`, {});
    }

    deleteById(notiId: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${notiId}`);
    }

    deleteAll(): Observable<any> {
        return this.http.delete(`${this.apiUrl}/me/all`);
    }

    private getNotificationMessage(notification: any): string {
        switch (notification?.type) {
            case 'like':
                return `${notification.senderName || notification.fromUserId?.username} đã thích bài viết của bạn`;
            case 'comment':
                return `${notification.senderName || notification.fromUserId?.username} đã bình luận bài viết của bạn`;
            case 'follow':
                return `${notification.senderName || notification.fromUserId?.username} đã theo dõi bạn`;
            case 'message':
                return 'Bạn có tin nhắn mới';
            case 'call':
                return 'Bạn có cuộc gọi mới';
            default:
                return 'Bạn có thông báo mới';
        }
    }
}