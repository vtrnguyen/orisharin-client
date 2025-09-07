import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // initialize notification service when user is authenticated
    if (this.authService.isLoggedIn && this.authService.isLoggedIn()) {
      this.notificationService.initializeNotificationCount();
      this.notificationService.initializeSocket();
    }
  }
}