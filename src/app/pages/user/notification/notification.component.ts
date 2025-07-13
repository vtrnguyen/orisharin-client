import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationItemComponen } from '../../../shared/components/notification-item/notification-item.component';
import { NotificationService } from '../../../core/services/notification.service';
import { ClickOutsideModule } from 'ng-click-outside';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [
    CommonModule,
    NotificationItemComponen,
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
    private notificationService: NotificationService
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
      },
      error: (error: any) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  handleMarkAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => n._id === id ? { ...n, isRead: true } : n);
      },
      error: (error: any) => {
        console.error('Error marking notification as read:', error);
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