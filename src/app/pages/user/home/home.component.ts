import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { FormsModule } from '@angular/forms';
import { PostModalComponent } from '../../../shared/components/post-modal/post-modal.component';
import { PostService } from '../../../core/services/post.service';
import { PostEventService } from '../../../shared/state-managements/post-event.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { navigateToProfile } from '../../../shared/functions/navigate-to-profile';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PostComponent,
    FormsModule,
    PostModalComponent,
    LoadingComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  userInfo: any;
  posts: any[] = [];
  showPostModal = false;
  newPostContent: string = '';
  isLoading = false;

  page = 1;
  limit = 10;
  hasMore = true;

  navigateToProfile = navigateToProfile;

  // IntersectionObserver setup
  @ViewChildren('postItem', { read: ElementRef }) postItems!: QueryList<ElementRef>;
  private intersectionObserver: IntersectionObserver | null = null;

  constructor(
    private authService: AuthService,
    private postService: PostService,
    private postEventService: PostEventService,
    public router: Router,
    private userService: UserService,
  ) { }

  ngOnInit() {
    this.userInfo = this.authService.getCurrentUser();
    this.userInfo.avatar = this.userService.getCurrentUserAvatarUrl();
    this.loadPosts(true);
    this.postEventService.postCreated$.subscribe(() => {
      this.resetAndReload();
    });
    // removed window scroll listener in favor of IntersectionObserver
  }

  ngAfterViewInit() {
    // Re-observe when list changes
    this.postItems.changes.subscribe(() => {
      this.observeLastPost();
    });
    this.observeLastPost();
  }

  ngOnDestroy() {
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
    this.isLoading = true;
    this.postService.getPostsPaginated(this.page, this.limit).subscribe({
      next: (res) => {
        if (res.success) {
          this.posts = [...this.posts, ...res.data.data];
          this.hasMore = res.data.hasMore;
          this.page++;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.isLoading = false;
      }
    });
  }

  resetAndReload() {
    this.page = 1;
    this.posts = [];
    this.hasMore = true;
    this.loadPosts();
  }

  openPostModal() {
    this.showPostModal = true;
  }

  closePostModal() {
    this.showPostModal = false;
    this.newPostContent = '';
  }

  // remove post from local list when child emits deleted
  onPostDeleted(postId: string) {
    this.posts = this.posts.filter(p => {
      const pid = p.id || p._id || (p.post && (p.post._id || p.post.id));
      return pid !== postId;
    });
  }
}
