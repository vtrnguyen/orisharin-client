import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserListItemComponent } from '../../../shared/components/user-list-item/user-list-item.component';
import { FollowService } from '../../../core/services/follow.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';
import { ConfirmModalComponent } from '../../../shared/components/confirm-delete-modal/confirm-modal.component';
import { LoadingComponent } from "../../../shared/components/loading/loading.component";

interface UserSuggestion {
  id: string;
  avatarUrl: string;
  username: string;
  fullName: string;
  bio?: string;
  isFollowed?: boolean;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    UserListItemComponent,
    ConfirmModalComponent,
    LoadingComponent
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent implements OnInit, AfterViewInit, OnDestroy {
  searchValue = '';
  suggestions: UserSuggestion[] = [];

  // pagination / cursor
  limit = 10;
  after: string | null = null;
  hasMore = true;
  isLoading = false;

  currentUserId?: string;

  // intersectionObserver for lazy loading
  @ViewChildren('userItem', { read: ElementRef }) userItems!: QueryList<ElementRef>;
  private intersectionObserver: IntersectionObserver | null = null;
  private subs: Subscription[] = [];

  // confirm unfollow modal
  showUnfollowConfirm = false;
  selectedUserToUnfollow: UserSuggestion | null = null;

  constructor(
    private followService: FollowService,
    private authService: AuthService,
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?.id;
    this.resetAndLoad();
  }

  ngAfterViewInit(): void {
    // re-observe when list changes
    this.userItems.changes.subscribe(() => this.observeLastItem());
    this.observeLastItem();
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    this.subs.forEach(s => s.unsubscribe());
  }

  private observeLastItem(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    const items = this.userItems?.toArray() || [];
    if (!items.length) return;
    const lastEl = items[items.length - 1].nativeElement;
    this.intersectionObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (!this.isLoading && this.hasMore) {
            this.loadSuggestions();
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

  onSearchChange(): void {
    this.resetAndLoad();
  }

  private resetAndLoad(): void {
    this.after = null;
    this.suggestions = [];
    this.hasMore = true;
    this.loadSuggestions(true);
  }

  loadSuggestions(initial = false): void {
    if (this.isLoading || (!this.hasMore && !initial)) return;
    this.isLoading = true;
    const q = this.searchValue?.trim();
    const sub = this.followService.suggest(q, this.limit, this.after || undefined).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          const payload = res.data;
          const items = Array.isArray(payload.data) ? payload.data : [];
          const mapped = items.map((u: any) => ({
            id: u.id || u._id || (u._id && u._id.toString && u._id.toString()),
            avatarUrl: u.avatarUrl || u.avatar || '',
            username: u.username,
            fullName: u.fullName,
            bio: u.bio,
            isFollowed: !!u.isFollowed,
          })) as UserSuggestion[];

          this.suggestions = [...this.suggestions, ...mapped];
          this.after = payload.nextCursor || null;
          this.hasMore = !!payload.hasMore;
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading suggestions', err);
        this.isLoading = false;
      }
    });
    this.subs.push(sub);
  }

  toggleFollow(user: UserSuggestion): void {
    if (user.isFollowed) {
      // open confirm modal
      this.selectedUserToUnfollow = user;
      this.showUnfollowConfirm = true;
    } else {
      // follow immediately
      const sub = this.followService.follow(this.currentUserId || '', user.id).subscribe({
        next: () => { user.isFollowed = true; },
        error: () => { }
      });
      this.subs.push(sub);
    }
  }

  // called when user confirms in modal
  confirmUnfollow(user?: UserSuggestion): void {
    const target = user || this.selectedUserToUnfollow;
    if (!target) {
      this.showUnfollowConfirm = false;
      this.selectedUserToUnfollow = null;
      return;
    }
    this.showUnfollowConfirm = false;
    const sub = this.followService.unfollow(this.currentUserId || '', target.id).subscribe({
      next: () => {
        // update local state
        const idx = this.suggestions.findIndex(s => s.id === target.id);
        if (idx !== -1) this.suggestions[idx].isFollowed = false;
        // also clear selected
        this.selectedUserToUnfollow = null;
      },
      error: () => {
        // keep selected cleared and modal closed
        this.selectedUserToUnfollow = null;
      }
    });
    this.subs.push(sub);
  }

  // cancel handler
  cancelUnfollow(): void {
    this.showUnfollowConfirm = false;
    this.selectedUserToUnfollow = null;
  }
}