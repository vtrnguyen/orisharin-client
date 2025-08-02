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
import { FollowingUserDto, UserProfileDto, UserProfileResponseDto } from '../../../shared/dtos/user-profile.dto';
import { FollowService } from '../../../core/services/follow.service';

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
  userInfo: UserProfileDto = {} as UserProfileDto;
  followings: FollowingUserDto[] = [];
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
  isUpdatingProfile: boolean = false;
  isFollowing: boolean = false;
  isFollowLoading: boolean = false;
  currentUserId: string = "";
  showUnfollowConfirm = false;

  // folows modal properties
  showFollowModal = false;
  followTab: 'followers' | 'following' = 'followers';
  followersList: any[] = [];
  followingList: any[] = [];
  loadingFollowList = false;
  selectedUserToUnfollow: any = null;

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private route: ActivatedRoute,
    private userService: UserService,
    private alertService: AlertService,
    private followService: FollowService
  ) { }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    this.currentUserId = currentUser.id;
    let urlFullname = this.route.snapshot.paramMap.get('fullname');
    if (urlFullname?.startsWith('@')) {
      urlFullname = urlFullname.substring(1);
    }
    this.currentUsername = urlFullname || "";
    this.isOwner = urlFullname === currentUser.username;

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

    // Reset avatar states
    this.selectedAvatar = null;
    this.avatarPreview = null;
    this.avatarRemoved = false;

    // Reload user info to reset any preview changes
    this.loadUserProfile(this.currentUsername);
  }

  closePostModal(): void {
    this.showPostModal = false;
  }

  openAvatarViewer(): void {
    this.showAvatarViewer = true;
  }

  closeAvatarViewer(): void {
    this.showAvatarViewer = false;
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu(): void {
    this.showProfileMenu = false;
  }

  openFollowModal(tab: "followers" | "following"): void {
    this.followTab = tab;
    this.showFollowModal = true;
    this.loadFollowList();
  }

  closeFollowModal() {
    this.showFollowModal = false;
    this.followersList = [];
    this.followingList = [];
  }

  onAvatarFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedAvatar = input.files[0];
      this.avatarRemoved = false;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(this.selectedAvatar);

      this.closeAvatarMenu();
    }
  }

  onRemoveAvatar(): void {
    this.selectedAvatar = null;
    this.avatarPreview = null;
    this.avatarRemoved = true;
    this.closeAvatarMenu();
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

  copyProfileUrl(): void {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      this.alertService.show('success', 'Đã sao chép liên kết!', 4000);
    }).catch(err => {
      console.error('Không thể sao chép đường dẫn:', err);
      this.alertService.show('error', 'Sao chép thất bại!', 4000);
    });
    this.showProfileMenu = false;
  }

  openAddWebsiteModal(): void {
    this.newWebsiteUrl = '';
    this.showEditProfileModal = false;
    this.showAddWebsiteModal = true;
  }

  closeAddWebsiteModal(): void {
    this.showAddWebsiteModal = false;
    this.showEditProfileModal = true;
  }

  addWebsite(): void {
    const url = this.newWebsiteUrl.trim();
    if (!url) return;

    try {
      new URL(url);
    } catch {
      this.alertService.show('error', 'Đường dẫn không hợp lệ!', 3000);
      return;
    }

    if (this.userInfo.websiteLinks && this.userInfo.websiteLinks.some(u => u.trim().toLowerCase() === url.toLowerCase())) {
      this.alertService.show('error', 'Đường dẫn đã tồn tại!', 3000);
      return;
    }

    if (!this.userInfo.websiteLinks) this.userInfo.websiteLinks = [];
    this.userInfo.websiteLinks.push(url);
    this.newWebsiteUrl = '';
    this.closeAddWebsiteModal();
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
    const urls = this.userInfo.websiteLinks || [];
    const urlSet = new Set(urls.map((u: string) => u.trim().toLowerCase()));
    if (urlSet.size !== urls.length) {
      this.alertService.show('error', 'Các liên kết không được trùng nhau!', 4000);
      return;
    }
    if (urls.some((url: string) => !this.isValidUrl(url))) {
      this.alertService.show('error', 'Có liên kết không hợp lệ!', 4000);
      return;
    }

    this.isUpdatingProfile = true;

    const updateData: any = {
      bio: this.userInfo.bio,
      websiteLinks: this.userInfo.websiteLinks
    };
    if (this.selectedAvatar) {
      updateData.avatar = this.selectedAvatar;
    }
    if (this.avatarRemoved && !this.selectedAvatar) {
      updateData.avatar = null;
    }

    this.userService.updateUserProfile(updateData).subscribe({
      next: (response: any) => {
        this.isUpdatingProfile = false;
        if (response && response.data && response.data.avatarUrl) {
          this.userService.setCurrentUserAvatarUrl(response.data.avatarUrl);
        }
        this.alertService.show('success', 'Cập nhật thành công!', 3000);
        this.closeEditProfileModal();
        this.loadUserProfile(this.currentUsername);
      },
      error: () => {
        this.isUpdatingProfile = false;
        this.alertService.show('error', 'Cập nhật thất bại!', 4000);
      }
    });
  }

  onFollow(user?: any): void {
    const target = user || this.userInfo;
    this.isFollowLoading = true;
    this.followService.follow(this.currentUserId, target.id).subscribe({
      next: () => {
        target.isFollowed = true;
        if (!user) {
          this.isFollowing = true;
          this.userInfo.followersCount++;
        }
        this.isFollowLoading = false;
        this.alertService.show('success', `Đã theo dõi ${target.username}!`, 3000);
      },
      error: () => {
        this.isFollowLoading = false;
      }
    });
  }

  onUnfollow(user?: any): void {
    const target = user || this.userInfo;
    this.isFollowLoading = true;
    this.followService.unfollow(this.currentUserId, target.id).subscribe({
      next: () => {
        target.isFollowed = false;
        if (!user) {
          this.isFollowing = false;
          this.userInfo.followersCount--;
        }
        this.isFollowLoading = false;
        this.alertService.show('success', `Đã bỏ theo dõi ${target.username}!`, 3000);
      },
      error: () => {
        this.isFollowLoading = false;
      }
    });
  }

  confirmUnfollow(user?: any): void {
    if (user) {
      this.onUnfollow(user);
      this.selectedUserToUnfollow = null;
    } else {
      this.showUnfollowConfirm = false;
      this.onUnfollow();
    }
  }

  private loadUserProfile(query: string): void {
    if (query) {
      this.userService.getUserProfile(query).subscribe({
        next: (response: any) => {
          const user = {
            ...response.data.user,
            id: response.data.user._id,
          } as UserProfileDto;
          this.userInfo = user;
          this.followings = response.data.followings || [];
          this.avatarPreview = null;
          this.selectedAvatar = null;
          this.avatarRemoved = false;
          if (!this.isOwner) {
            this.checkIsFollowing();
          }
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
    });
  }

  private checkIsFollowing(): void {
    this.followService.checkFollow(this.currentUserId, this.userInfo.id).subscribe({
      next: (response: any) => {
        this.isFollowing = !!(response && response.data.isFollowing);
      },
      error: () => {
        this.isFollowing = false;
      }
    });
  }

  loadFollowList(): void {
    this.loadingFollowList = true;
    const userId = this.userInfo.id;
    if (this.followTab === 'followers') {
      this.followService.getFollowers(userId).subscribe(res => {
        this.followersList = res.data || [];
        this.loadingFollowList = false;
      });
    } else {
      this.followService.getFollowing(userId).subscribe(res => {
        this.followingList = res.data || [];
        this.loadingFollowList = false;
      });
    }
  }
}