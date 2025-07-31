import { Component, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostModalComponent } from '../../../shared/components/post-modal/post-modal.component';
import { PostComponent } from '../../../shared/components/post/post.component';
import { ClickOutsideModule } from 'ng-click-outside';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { MediaViewerComponent } from '../../../shared/components/media-viewer/media-viewer.component';
import { PostService } from '../../../core/services/post.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../../shared/state-managements/alert.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PostModalComponent,
    PostComponent,
    ClickOutsideModule,
    MediaViewerComponent,
    LoadingComponent,
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
  isLoading = true;
  showProfileMenu = false;
  showEditProfileModal = false;
  showAddWebsiteModal = false;
  newWebsiteUrl = '';
  showAvatarMenu: boolean = false;

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private route: ActivatedRoute,
    private userService: UserService,
    private alertService: AlertService
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

    this.loadUserProfile(this.currentUsername);
    this.loadPosts();
  }

  openPostModal(): void {
    this.showPostModal = true;
  }

  onEditProfile(): void {
    this.showEditProfileModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeEditProfileModal(): void {
    this.showEditProfileModal = false;
    document.body.style.overflow = 'auto';
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

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu() {
    this.showProfileMenu = false;
  }

  onUploadAvatar() {

  }

  onRemoveAvatar() {

  }

  openAvatarMenu(): void {
    this.showAvatarMenu = true;
  }

  closeAvatarMenu(): void {
    this.showAvatarMenu = false;
  }

  onUsernameInputClick(): void {
    this.alertService.show('warning', 'Tên người dùng không thể thay đổi!', 3000);
  }

  copyPorfileUrl(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.alertService.show('success', 'Đã sao chép liên kết!', 4000);
    }).catch(err => {
      console.error('Không thể sao chép đường dẫn:', err);
      this.alertService.show('error', 'Sao chép thất bại!', 4000);
    });
    this.showProfileMenu = false;
  }

  openAddWebsiteModal() {
    this.newWebsiteUrl = '';
    this.showEditProfileModal = false;
    this.showAddWebsiteModal = true;
  }

  closeAddWebsiteModal() {
    this.showAddWebsiteModal = false;
    this.showEditProfileModal = true;
  }

  addWebsite() {
    if (this.newWebsiteUrl.trim()) {
      if (!this.userInfo.websites) {
        this.userInfo.websites = [];
      }
      this.userInfo.websites.push(this.newWebsiteUrl.trim());
      this.newWebsiteUrl = '';
      this.closeAddWebsiteModal();
    }
  }
  private loadUserProfile(query: string): void {
    if (query) {
      this.userService.getUserProfile(query).subscribe({
        next: (response: any) => {
          this.userInfo = response.data;
        },
        error: (error: any) => {
          console.error('Error fetching user profile:', error);
        }
      });
    }
  }

  private loadPosts(): void {
    this.isLoading = true;
    this.postService.getPostByUsername(this.currentUsername).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching posts:', error);
        this.isLoading = false;
      }
    })
  }
}