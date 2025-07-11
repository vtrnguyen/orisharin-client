import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PostModalComponent } from '../../shared/components/post-modal/post-modal.component';

@Component({
    selector: 'app-user-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        CommonModule,
        PostModalComponent,
    ],
    templateUrl: './user.layout.html',
    styleUrl: './user.layout.scss'
})
export class UserLayoutComponent {
    userInfo: any;
    showPostModal = false;
    newPostContent = '';

    openPostModal() {
        this.showPostModal = true;
    }

    closePostModal() {
        this.showPostModal = false;
    }

    constructor(private authService: AuthService) {
        this.userInfo = this.authService.getCurrentUser();
        this.userInfo.avatar = "https://github.com/vtrnguyen/hosting-image-file/blob/main/oribuyin/avatar/avatar15.png?raw=true";
    }
}