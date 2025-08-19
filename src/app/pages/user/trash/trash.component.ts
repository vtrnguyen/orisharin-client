import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { PostService } from '../../../core/services/post.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../shared/state-managements/alert.service';
import { AuthService } from '../../../core/services/auth.service';
import { navigateToProfile } from '../../../shared/functions/navigate-to-profile';

@Component({
  selector: 'app-trash',
  standalone: true,
  imports: [
    CommonModule,
    PostComponent,
    LoadingComponent,
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
    this.loadDeletedPosts(true);
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
            this.loadDeletedPosts();
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

  loadDeletedPosts(initial = false) {
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

  // helper to normalize id shapes
  private getPostId(item: any): string | null {
    return item?.post?.id ?? item?.post?._id ?? item?.id ?? item?._id ?? null;
  }

  restore(item: any, event?: MouseEvent) {
    if (event) event.stopPropagation();
    const id = this.getPostId(item);
    if (!id) return;
    // this.postService.restorePost(id).subscribe({
    //   next: (res) => {
    //     this.posts = this.posts.filter(p => this.getPostId(p) !== id);
    //     this.alertService.show('success', 'Khôi phục bài viết thành công', 3000);
    //   },
    //   error: (err) => {
    //     console.error('Restore failed', err);
    //     this.alertService.show('error', 'Khôi phục thất bại');
    //   }
    // });
  }

  permanentlyDelete(item: any, event?: MouseEvent) {
    if (event) event.stopPropagation();
    const confirmDelete = confirm('Xóa vĩnh viễn bài viết này? Hành động không thể hoàn tác.');
    if (!confirmDelete) return;

    const id = this.getPostId(item);
    if (!id) return;
    // this.postService.permanentlyDeletePost(id).subscribe({
    //   next: () => {
    //     this.posts = this.posts.filter(p => this.getPostId(p) !== id);
    //     this.alertService.show('success', 'Đã xóa vĩnh viễn', 3000);
    //   },
    //   error: (err) => {
    //     console.error('Permanent delete failed', err);
    //     this.alertService.show('error', 'Xóa vĩnh viễn thất bại');
    //   }
    // });
  }

  // optional: open post detail (navigate)
  openPostDetail(item: any, event?: MouseEvent) {
    if (event) event.stopPropagation();
    const username = item?.author?.username || item?.post?.author?.username;
    const id = this.getPostId(item);
    if (username && id) {
      this.router.navigate([`@${username}`, 'post', id]);
    }
  }
}