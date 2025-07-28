import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostModalComponent } from '../../../shared/components/post-modal/post-modal.component';
import { PostComponent } from '../../../shared/components/post/post.component';
import { ClickOutsideModule } from 'ng-click-outside';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { MediaViewerComponent } from '../../../shared/components/media-viewer/media-viewer.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    PostModalComponent,
    PostComponent,
    ClickOutsideModule,
    MediaViewerComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  userInfo: any;
  isOwner: boolean = false;
  followers: any[] = [];
  posts: any[] = [];
  showPostModal: boolean = false;
  showAvatarViewer = false;
  currentUsername: string = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.userInfo = this.authService.getCurrentUser();
    this.userInfo.avatar = "https://randomuser.me/api/portraits/men/32.jpg";
    this.userInfo.followers = [
      { avatar: 'https://randomuser.me/api/portraits/men/11.jpg', name: 'User 1' },
      { avatar: 'https://randomuser.me/api/portraits/women/12.jpg', name: 'User 2' },
      { avatar: 'https://randomuser.me/api/portraits/men/13.jpg', name: 'User 3' },
      { avatar: 'https://randomuser.me/api/portraits/women/14.jpg', name: 'User 4' }
    ];

    let urlFullname = this.route.snapshot.paramMap.get('fullname');
    if (urlFullname?.startsWith('@')) {
      urlFullname = urlFullname.substring(1);
    }
    this.currentUsername = urlFullname || "";
    this.isOwner = urlFullname === this.userInfo.username;
  }

  openPostModal(): void {
    this.showPostModal = true;
  }

  onEditProfile(): void {
  }

  closePostModal() {
    this.showPostModal = false;
  }

  openAvatarViewer() {
    this.showAvatarViewer = true;
  }
  closeAvatarViewer() {
    this.showAvatarViewer = false;
  }
}