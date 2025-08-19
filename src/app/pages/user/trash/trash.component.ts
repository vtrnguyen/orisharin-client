import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { PostService } from '../../../core/services/post.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../shared/state-managements/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { navigateToProfile } from '../../../shared/functions/navigate-to-profile';
import { ConfirmModalComponent } from '../../../shared/components/confirm-delete-modal/confirm-modal.component';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [
    CommonModule,
    PostComponent,
    LoadingComponent,
    ConfirmModalComponent,
  ],
  templateUrl: './trash.component.html',
  styleUrls: ['./trash.component.scss']
})
export class TrashComponent implements OnInit, AfterViewInit, OnDestroy {
  posts: any[] = [];
  page = 1;
  limit = 10;
  hasMore = true;
  isLoading = false;
  username: string = '';
  currentUser: any = null;

  // confirm modal state
  showRestoreConfirm = false;
  restoreTarget: any = null;

  showPermanentConfirm = false;
  permanentTarget: any = null;

  navigateToProfile = navigateToProfile;

  @ViewChildren('postItem', { read: ElementRef }) postItems!: QueryList<ElementRef>;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(
    private postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private alertService: AlertService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    let usernameParam = (this.route.snapshot.paramMap.get('username') ?? '') || (this.route.snapshot.paramMap.get('user') ?? '');
    if (!usernameParam && this.currentUser) {
      usernameParam = this.currentUser.username;
    }
    if (usernameParam?.startsWith('@')) usernameParam = usernameParam.substring(1);
    this.username = usernameParam;
    this.loadPosts(true);
  }

  ngAfterViewInit(): void {
    this.postItems.changes.subscribe(() => {
      this.observeLastPost();
    });
    this.observeLastPost();
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
  }

  private observeLastPost(): void {
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
          if (!this.isLoading && this.hasMore) {
            this.loadPosts();
          }
        }
      });
    }, {
      root: null,
      rootMargin: '0px',
      threshold: 1
    });

    this.intersectionObserver.observe(lastEl);
  }

  loadPosts(initial = false) {
    if (this.isLoading || (!this.hasMore && !initial)) return;
    if (!this.username) return;
    this.isLoading = true;
    this.postService.getDeletedByUsername(this.username, this.page, this.limit).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.posts = [...this.posts, ...response.data.data];
          this.hasMore = response.data.hasMore;
          this.page++;
        } else {
          this.alertService.show('error', response.message || 'Không thể tải thùng rác');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading deleted posts:', err);
        this.alertService.show('error', 'Lỗi khi tải thùng rác');
        this.isLoading = false;
      }
    });
  }

  private getPostId(item: any): string | null {
    return item?.post?.id ?? item?.post?._id ?? item?.id ?? item?._id ?? null;
  }

  openRestoreConfirm(item: any, event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.restoreTarget = item;
    this.showRestoreConfirm = true;
  }

  openPermanentConfirm(item: any, event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.permanentTarget = item;
    this.showPermanentConfirm = true;
  }

  confirmRestore() {
    const id = this.getPostId(this.restoreTarget);
    if (!id) {
      this.showRestoreConfirm = false;
      this.restoreTarget = null;
      return;
    }
    this.postService.restorePost(id).subscribe({
      next: (res) => {
        if (res?.success) {
          this.posts = this.posts.filter(p => this.getPostId(p) !== id);
          this.alertService.show('success', 'Đã khôi phục bài viết');
        } else {
          this.alertService.show('error', res?.message || 'Đã xảy ra lỗi khi khôi phục bài viết');
        }
        this.showRestoreConfirm = false;
        this.restoreTarget = null;
      },
      error: (err) => {
        console.error('Restore failed', err);
        this.alertService.show('error', 'Đã xảy ra lỗi khi khôi phục bài viết');
        this.showRestoreConfirm = false;
        this.restoreTarget = null;
      }
    });
  }

  cancelRestore() {
    this.showRestoreConfirm = false;
    this.restoreTarget = null;
  }

  confirmPermanentDelete() {
    const id = this.getPostId(this.permanentTarget);
    if (!id) {
      this.showPermanentConfirm = false;
      this.permanentTarget = null;
      return;
    }
    this.postService.permanentlyDeletePost(id).subscribe({
      next: (res) => {
        if (res?.success) {
          this.posts = this.posts.filter(p => this.getPostId(p) !== id);
          this.alertService.show('success', 'Đã xóa bài viết');
        } else {
          this.alertService.show('error', res?.message || 'Đã xảy ra lỗi khi xóa bài viết');
        }
        this.showPermanentConfirm = false;
        this.permanentTarget = null;
      },
      error: (err) => {
        console.error('Permanent delete failed', err);
        this.alertService.show('error', 'Đã xảy ra lỗi khi xóa bài viết');
        this.showPermanentConfirm = false;
        this.permanentTarget = null;
      }
    });
  }

  cancelPermanentDelete() {
    this.showPermanentConfirm = false;
    this.permanentTarget = null;
  }
}