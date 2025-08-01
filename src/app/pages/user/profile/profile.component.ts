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
  selectedAvatar: File | null = null;
  avatarPreview: string | null = null;
  avatarRemoved: boolean = false;

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

  onAvatarFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedAvatar = input.files[0];
      this.avatarRemoved = false;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
        this.userInfo.avatar = this.avatarPreview;
      };
      reader.readAsDataURL(this.selectedAvatar);
    }
  }

  onRemoveAvatar() {
    this.selectedAvatar = null;
    this.avatarRemoved = true;
    this.avatarPreview = null;
    this.userInfo.avatar = '';
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

  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  hasDuplicateUrls(urls: string[]): boolean {
    const set = new Set(urls.map(u => u.trim().toLowerCase()));
    return set.size !== urls.length;
  }

  onSubmitProfile(): void {
    const urls = this.userInfo.websites || [];
    const urlSet = new Set(urls.map((u: string) => u.trim().toLowerCase()));
    if (urlSet.size !== urls.length) {
      this.alertService.show('error', 'Các liên kết không được trùng nhau!', 4000);
      return;
    }
    const isValidUrl = (url: string) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };
    if (urls.some((url: string) => !isValidUrl(url))) {
      this.alertService.show('error', 'Có liên kết không hợp lệ!', 4000);
      return;
    }

    this.userService.updateUserProfile({
      bio: this.userInfo.bio,
      websiteLinks: urls
    }).subscribe({
      next: (res: any) => {
        this.alertService.show('success', 'Cập nhật thành công!', 3000);
        this.closeEditProfileModal();
        this.loadUserProfile(this.currentUsername);
      },
      error: () => {
        this.alertService.show('error', 'Cập nhật thất bại!', 4000);
      }
    });
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