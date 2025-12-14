import { AfterViewInit, Component, ElementRef, OnChanges, OnDestroy, OnInit, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostModalComponent } from '../../../shared/components/post-modal/post-modal.component';
import { PostComponent } from '../../../shared/components/post/post.component';
import { ClickOutsideModule } from 'ng-click-outside';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MediaViewerComponent } from '../../../shared/components/media-viewer/media-viewer.component';
import { PostService } from '../../../core/services/post.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../../shared/state-managements/alert.service';
import { FormsModule } from '@angular/forms';
import { FollowingUserDto, UserProfileDto } from '../../../shared/dtos/user-profile.dto';
import { FollowService } from '../../../core/services/follow.service';
import { UserListItemComponent } from '../../../shared/components/user-list-item/user-list-item.component';
import { ConfirmModalComponent } from '../../../shared/components/confirm-delete-modal/confirm-modal.component';
import { EscToCloseDirective } from '../../../shared/directives/esc-to-close.directive';

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
    UserListItemComponent,
    ConfirmModalComponent,
    EscToCloseDirective
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit, OnDestroy, AfterViewInit {
  userInfo: UserProfileDto = {} as UserProfileDto;
  followings: FollowingUserDto[] = [];
  isOwner: boolean = false;
  showPostModal: boolean = false;
  showAvatarViewer = false;
  currentUsername: string = '';
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
  editBio: string = '';

  // load posts properties
  posts: any[] = [];
  isLoading: boolean = false;
  page: number = 1;
  limit: number = 10;
  hasMore: boolean = true;

  // folows modal properties
  showFollowModal = false;
  followTab: 'followers' | 'following' = 'followers';
  followersList: any[] = [];
  followingList: any[] = [];
  loadingFollowList = false;
  selectedUserToUnfollow: any = null;

  // introduce modal properties
  showIntroduceModal = false;
  introduceInfo: any = null;
  isLoadingIntroduce = false;

  // web urls modal properties
  showWebsiteModal = false;

  // metion user properties
  postModalContent: string = '';

  @ViewChildren('postItem', { read: ElementRef }) postItems!: QueryList<ElementRef>;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private route: ActivatedRoute,
    private userService: UserService,
    private alertService: AlertService,
    private followService: FollowService,
    private router: Router,
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

    this.page = 1;
    this.posts = [];
    this.hasMore = true;
    this.loadPosts(true);
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }

  ngAfterViewInit(): void {
    // Re-observe when the list changes (new posts appended)
    this.postItems.changes.subscribe(() => {
      this.observeLastPost();
    });
    // Initial observe
    this.observeLastPost();
  }

  private observeLastPost(): void {
    // disconnect previous observer
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    const items = this.postItems?.toArray() || [];
    if (!items.length) return;

    const lastEl = items[items.length - 1].nativeElement;
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // only load if not already loading and hasMore
          if (!this.isLoading && this.hasMore) {
            this.loadPosts();
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 1.0
    });

    this.intersectionObserver.observe(lastEl);
  }

  openPostModal(initialContent: string = ''): void {
    this.postModalContent = initialContent;
    this.showPostModal = true;
  }

  onEditProfile(): void {
    this.editBio = this.userInfo.bio || '';
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

  openIntroduceModal(): void {
    this.isLoadingIntroduce = true;
    this.showIntroduceModal = true;
    this.userService.introduceUser(this.userInfo.id).subscribe({
      next: (res) => {
        this.introduceInfo = res.data;
        this.isLoadingIntroduce = false;
      },
      error: () => {
        this.isLoadingIntroduce = false;
        this.introduceInfo = null;
      }
    });
  }

  closeIntroduceModal(): void {
    this.showIntroduceModal = false;
    this.introduceInfo = null;
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
      bio: this.editBio,
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
        this.editBio = '';
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

  onUnfollowClick() {
    this.showUnfollowConfirm = true;
    this.selectedUserToUnfollow = null;
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
          if (response && response.success === true) {
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
          } else {
            this.router.navigate(['/not-found']);
          }
        },
        error: (error: any) => {
          this.router.navigate(['/not-found']);
        }
      });
    }
  }

  private loadPosts(initial: boolean = false): void {
    if (this.isLoading || (!this.hasMore && !initial)) return;
    this.isLoading = true;

    this.postService.getPostByUsername(this.currentUsername, this.page, this.limit).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.posts = [...this.posts, ...res.data.data];
          this.hasMore = res.data.hasMore;
          this.page++;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error fetching posts:', error);
        this.isLoading = false;
      }
    });
  }

  onScroll = () => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 600;
    if (scrollPosition >= threshold) {
      this.loadPosts();
    }
  };

  navigateToTrash(): void {
    this.router.navigate(['/trash']);
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

  // remove post from local list when child emits deleted
  onPostDeleted(postId: string) {
    this.posts = this.posts.filter(p => {
      const pid = p.id || p._id || (p.post && (p.post._id || p.post.id));
      return pid !== postId;
    });
  }

  onWebsiteClick(event: MouseEvent): void {
    if (this.userInfo?.websiteLinks?.length > 1) {
      event.preventDefault();
      this.showWebsiteModal = true;
    }
  }

  openWebsiteModal(): void {
    this.showWebsiteModal = true;
  }

  closeWebsiteModal(): void {
    this.showWebsiteModal = false;
  }
}
