import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItemComponent } from '../../../shared/components/notification-item/notification-item.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ClickOutsideModule } from 'ng-click-outside';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AlertService } from '../../../shared/state-managements/alert.service';
import { ConfirmModalComponent } from '../../../shared/components/confirm-delete-modal/confirm-modal.component';
import { Subscription } from 'rxjs';
import { formatTime } from '../../../shared/functions/format-time.util';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,
    NotificationItemComponent,
    ClickOutsideModule,
    LoadingComponent,
    ConfirmModalComponent
  ],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: any[] = [];
  showMenu: boolean = false;
  isLoading: boolean = true;
  showConfirmDeleteAll: boolean = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private alertService: AlertService,
  ) { }

  ngOnInit() {
    this.loadNotifications();
    this.setupNotificationSocket();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupNotificationSocket() {
    // listen for new notifications
    const newNotificationSub = this.notificationService.onNewNotification().subscribe(notification => {
      this.notifications.unshift(notification);
    });

    this.subscriptions.push(newNotificationSub);
  }

  openMenu() {
    this.showMenu = true;
  }

  closeMenu() {
    this.showMenu = false;
  }

  markAllAsRead() {
    let isAllRead = this.notifications.every(n => n.isRead);

    if (isAllRead) {
      this.alertService.show('success', 'Bạn không có thông báo mới nào!');
      return;
    }

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
        this.alertService.show('success', 'Đã đọc tất cả thông báo!');
      },
      error: (error: any) => {
        this.alertService.show('error', 'Có lỗi xảy ra!');
      }
    });
  }

  maskAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => n._id === id ? { ...n, isRead: true } : n);
        this.alertService.show('success', 'Đã đọc thông báo!');
      },
      error: (error: any) => {
        this.alertService.show('error', 'Có lỗi xảy ra!');
      }
    })
  }

  deleteAll() {
    if (this.notifications.length === 0) {
      this.alertService.show('warning', 'Không có thông báo nào để xóa!');
      return;
    }

    this.notificationService.deleteAll().subscribe({
      next: () => {
        this.notifications = [];
        this.alertService.show('success', 'Đã xóa tất cả thông báo!');
      },
      error: (error: any) => {
        this.alertService.show('error', 'Có lỗi xảy ra!');
      }
    });
  }

  private loadNotifications() {
    this.isLoading = true;
    this.notificationService.getMyNotifications().subscribe({
      next: (data: any) => {
        this.notifications = data;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.isLoading = false;
      }
    });
  }
}