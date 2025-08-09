import { Component, OnInit, OnDestroy } from '@angular/core';
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
export class HomeComponent implements OnInit, OnDestroy {
  userInfo: any;
  posts: any[] = [];
  showPostModal = false;
  newPostContent: string = '';
  isLoading = false;

  page = 1;
  limit = 10;
  hasMore = true;

  navigateToProfile = navigateToProfile;

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
    window.addEventListener('scroll', this.onScroll, true);
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll, true);
  }

  onScroll = () => {
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.body.offsetHeight - 600;
    if (scrollPosition >= threshold) {
      this.loadPosts();
    }
  };

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
}