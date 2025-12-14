import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { UserService } from '../../../core/services/user.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { CommentService } from '../../../core/services/comment.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlertService } from '../../state-managements/alert.service';
import { isImage, isVideo } from '../../functions/media-type.util';
import { formatTime } from '../../functions/format-time.util';
import { navigateToProfile } from '../../functions/navigate-to-profile';
import { Router } from '@angular/router';
import { CommentEventService } from '../../state-managements/comment-event.service';
import { EscToCloseDirective } from '../../directives/esc-to-close.directive';

@Component({
  selector: 'app-create-comment',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClickOutsideModule,
    PickerComponent,
    EscToCloseDirective,
  ],
  templateUrl: './create-comment.component.html',
  styleUrl: './create-comment.component.scss'
})
export class CreateCommentComponent implements OnInit, OnDestroy {
  @Input() parent: any;
  @Input() isReplyMode: boolean = false;
  @Output() close = new EventEmitter<void>();

  content = '';
  images: string[] = [];
  files: File[] = [];
  isLoading = false;
  showEmojiPicker = false;
  userInfo: any;

  isVideo = isVideo;
  isImage = isImage;
  formatTime = formatTime;
  navigateToProfile = navigateToProfile;

  // prefill tracking
  autoPrefillUsernameRaw: string | null = null;
  userEditedPrefill = false;

  constructor(
    private userService: UserService,
    private commentService: CommentService,
    private authService: AuthService,
    private alertService: AlertService,
    public router: Router,
    private commentEventService: CommentEventService
  ) {
    this.userInfo = this.userService.getCurrentUserInfo();
  }

  ngOnInit() {
    document.body.style.overflow = 'hidden';

    try {
      // only prefill when replying to a reply (level-2) and content empty
      if (this.isReplyMode && this.parent?.parentCommentId && !this.content.trim()) {
        const replyAuthor = this.parentAuthor || {};
        const replyAuthorUsername = replyAuthor?.username || replyAuthor?.userName;
        const currentUser = this.authService.getCurrentUser();
        const currentUsername = currentUser?.username || this.userInfo?.username;

        if (replyAuthorUsername && currentUsername && replyAuthorUsername !== currentUsername) {
          this.autoPrefillUsernameRaw = `@${replyAuthorUsername}`;
          this.content = `${this.autoPrefillUsernameRaw} `;
          this.userEditedPrefill = false;

          setTimeout(() => {
            const textarea = document.querySelector('textarea');
            if (textarea) {
              const el = textarea as HTMLTextAreaElement;
              el.selectionStart = el.selectionEnd = el.value.length;
              el.focus();
            }
          }, 0);
        }
      }
    } catch (e) {
      console.warn('Prefill reply username failed', e);
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = 'auto';
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      Array.from(input.files).forEach(file => {
        this.files.push(file);
        const reader = new FileReader();
        reader.onload = (e: any) => this.images.push(e.target.result);
        reader.readAsDataURL(file);
      });
      input.value = '';
    }
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
    this.files.splice(index, 1);
  }

  submitComment(): void {
    if (!this.content.trim() && this.files.length === 0) return;
    this.isLoading = true;

    const currentUser = this.authService.getCurrentUser();
    const authorId = currentUser?.id || this.userInfo?.id;

    const resolveTopLevelCommentId = (p: any): string | undefined => {
      if (!p) return undefined;
      if (p.parentCommentId) return p.parentCommentId;
      return p._id || p.id;
    };

    const resolvePostId = (p: any): string | undefined => {
      if (!p) return undefined;
      if (p.postId) return p.postId;
      if (p.post && (p.post._id || p.post.id)) return p.post._id || p.post.id;
      if (p._id && p.author == null) return p._id;
      return undefined;
    };

    let postId = '';
    let parentCommentId: string | undefined = undefined;
    let finalContent = this.content?.trim() || '';

    if (this.isReplyMode) {
      parentCommentId = resolveTopLevelCommentId(this.parent);
      postId = resolvePostId(this.parent) || this.parent?.post?.postId || '';

      if (!postId) {
        console.warn('create-comment: cannot resolve postId from parent', this.parent);
      }
      if (!parentCommentId) {
        console.warn('create-comment: cannot resolve parentCommentId from parent', this.parent);
      }

      const isReplyToReply = !!(this.parent && this.parent.parentCommentId);

      if (isReplyToReply) {
        const replyAuthor = this.parentAuthor;
        const replyAuthorUsername = replyAuthor?.username || replyAuthor?.userName;
        const currentUsername = currentUser?.username || this.userInfo?.username;

        // Only auto-add prefix when we set autoPrefill and user did NOT edit it.
        if (replyAuthorUsername && currentUsername && replyAuthorUsername !== currentUsername) {
          if (this.autoPrefillUsernameRaw && !this.userEditedPrefill) {
            // ensure prefix exists (add if user somehow focused away without editing)
            if (!finalContent.startsWith(this.autoPrefillUsernameRaw)) {
              finalContent = `${this.autoPrefillUsernameRaw} ${finalContent}`;
            }
          } else {
            // user edited prefill (deleted it) -> do NOT re-add
            // also if userEditedPrefill is true but content still accidentally contains @username at start, keep user's intent
          }
        }
      }
    } else {
      postId = this.parent?._id || this.parent?.id || this.parent?.post?._id || this.parent?.post?.id || '';
      parentCommentId = undefined;
      if (!postId) {
        console.warn('create-comment: cannot resolve postId for top-level comment', this.parent);
      }
    }

    if (!postId) {
      this.isLoading = false;
      this.alertService.show('error', 'Không xác định được bài viết để bình luận', 3000);
      return;
    }

    this.commentService.createComment(
      {
        postId,
        parentCommentId,
        authorId,
        content: finalContent,
      },
      this.files
    ).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.commentEventService.emitCommentCreated(response.data);
        this.close.emit();
        this.resetForm();
        const message = this.isReplyMode ? 'Đã gửi trả lời bình luận!' : 'Đã gửi bình luận!';
        this.alertService.show("success", message);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.alertService.show("error", "Đã có lỗi xảy ra khi gửi bình luận. Vui lòng thử lại sau.");
      }
    });
  }

  onContentChange(value: string) {
    if (this.autoPrefillUsernameRaw) {
      // consider unprefixed or modified as edited
      if (!value.startsWith(this.autoPrefillUsernameRaw)) {
        this.userEditedPrefill = true;
      } else {
        this.userEditedPrefill = false;
      }
    }
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  toggleEmojiPicker() {
    this.showEmojiPicker = !this.showEmojiPicker;
  }

  addEmoji(event: any) {
    this.content += event.emoji?.native || event.emoji;
  }

  get parentContent() {
    return this.parent?.content || this.parent?.post?.content || '';
  }
  get parentMediaUrls() {
    return this.parent?.mediaUrls || this.parent?.post?.mediaUrls || [];
  }
  get parentCreatedAt() {
    return this.parent?.createdAt || this.parent?.post?.createdAt || '';
  }
  get parentAuthor() {
    return this.parent?.author || this.parent?.authorId || this.parent?.post?.author || this.parent?.post?.authorId || {};
  }

  private resetForm() {
    this.content = "";
    this.images = [];
    this.files = [];
  }
}