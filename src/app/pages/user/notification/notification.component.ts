import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItemComponent } from '../../../shared/components/notification-item/notification-item.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ClickOutsideModule } from 'ng-click-outside';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { AlertService } from '../../../shared/state-managements/alert.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,
    NotificationItemComponent,
    ClickOutsideModule,
    LoadingComponent,
  ],
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss'],
})
export class NotificationComponent implements OnInit {
  notifications: any[] = [];
  showMenu = false;
  isLoading = true;

  constructor(
    private notificationService: NotificationService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.loadNotifications();
  }

  openMenu() {
    this.showMenu = true;
  }

  closeMenu() {
    this.showMenu = false;
  }

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
        this.alertService.show(
          'success',
          'Đã đọc tất cả thông báo!',
          2000,
        );
      },
      error: (error: any) => {
        this.alertService.show('error', 'Có lỗi xảy ra!', 4000);
      }
    });
  }

  handleMarkAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => n._id === id ? { ...n, isRead: true } : n);
        this.alertService.show(
          'success',
          'Đã đọc thông báo!',
          2000
        );
      },
      error: (error: any) => {
        this.alertService.show('error', 'Có lỗi xảy ra!', 4000);
      }
    })
  }

  deleteAll() {
    this.notifications = [];
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