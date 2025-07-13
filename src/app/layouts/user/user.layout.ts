import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PostModalComponent } from '../../shared/components/post-modal/post-modal.component';
import { ClickOutsideModule } from 'ng-click-outside';
import { AlertService } from '../../shared/state-managements/alert.service';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AlertState } from '../../shared/interfaces/alert.interface';

@Component({
    selector: 'app-user-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        CommonModule,
        PostModalComponent,
        ClickOutsideModule,
        AlertComponent,
    ],
    templateUrl: './user.layout.html',
    styleUrl: './user.layout.scss'
})
export class UserLayoutComponent {
    alertState: AlertState = { show: false, type: 'success', message: '', duration: 2500 };
    userInfo: any;

    // post modal properties
    showPostModal = false;
    newPostContent = '';

    showUserMenu = false;

    constructor(
        private authService: AuthService,
        public alertService: AlertService,
    ) {
        this.alertService.alert$.subscribe(state => this.alertState = state);
        this.userInfo = this.authService.getCurrentUser();
        this.userInfo.avatar = "https://github.com/vtrnguyen/hosting-image-file/blob/main/oribuyin/avatar/avatar15.png?raw=true";
    }

    openPostModal() {
        this.showPostModal = true;
    }

    closePostModal() {
        this.showPostModal = false;
    }

    toggleUserMenu() {
        this.showUserMenu = !this.showUserMenu;
    }

    logout() {
        this.authService.logout();
    }
}