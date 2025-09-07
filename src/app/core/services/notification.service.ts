import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationSocketService } from './notification-socket.service';
import { AlertService } from '../../shared/state-managements/alert.service';

@Injectable({
    providedIn: 'root'
})
export class NotificationService implements OnDestroy {
    private apiUrl = environment.apiUrl + '/notifications';
    private newNotification$ = new Subject<any>();
    private notificationCount$ = new BehaviorSubject<number>(0);

    constructor(
        private http: HttpClient,
        private notificationSocket: NotificationSocketService,
        private alertService: AlertService,
    ) {
        this.initializeSocket();
    }

    ngOnDestroy() {
        this.notificationSocket.disconnect();
    }

    private initializeSocket() {
        // connect to notification socket
        this.notificationSocket.connect();

        // listen for new notifications
        this.notificationSocket.onNotificationReceived().subscribe(notification => {
            this.alertService.show('success', `${this.getNotificationMessage(notification)}`);
            this.newNotification$.next(notification);
            // update notification count
            this.updateNotificationCount();
        });
    }

    private updateNotificationCount() {
        this.getMyNotifications().subscribe(notifications => {
            const unreadCount = notifications.filter(n => !n.isRead).length;
            this.notificationCount$.next(unreadCount);
        });
    }

    // observable for new notifications
    onNewNotification(): Observable<any> {
        return this.newNotification$.asObservable();
    }

    // observable for notification count
    getNotificationCount(): Observable<number> {
        return this.notificationCount$.asObservable();
    }

    // initialize notification count
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
        switch (notification.type) {
            case 'like':
                return `${notification.senderName} đã thích bài viết của bạn`;
            case 'comment':
                return `${notification.senderName} đã bình luận bài viết của bạn`;
            case 'follow':
                return `${notification.senderName} đã theo dõi bạn`;
            case 'message':
                return 'Bạn có tin nhắn mới';
            case 'call':
                return 'Bạn có cuộc gọi mới';
            default:
                return 'Bạn có thông báo mới';
        }
    }
}