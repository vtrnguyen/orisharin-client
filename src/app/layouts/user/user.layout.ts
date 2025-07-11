import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PostModalComponent } from '../../shared/components/post-modal/post-modal.component';
import { ClickOutsideModule } from 'ng-click-outside';

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
    ],
    templateUrl: './user.layout.html',
    styleUrl: './user.layout.scss'
})
export class UserLayoutComponent {
    userInfo: any;

    // post modal properties
    showPostModal = false;
    newPostContent = '';

    showUserMenu = false;

    constructor(private authService: AuthService) {
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