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

@Component({
  selector: 'app-create-comment',
  standalone: true,
  imports: [CommonModule, FormsModule, ClickOutsideModule, PickerComponent],
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
    console.log(this.parent);
    document.body.style.overflow = 'hidden';
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

    // get current user id
    const currentUser = this.authService.getCurrentUser();
    const authorId = currentUser?.id || this.userInfo?.id;

    let postId = '';
    let parentCommentId: string | undefined = undefined;

    if (this.isReplyMode) {
      // reply comment
      postId = this.parent.postId;
      parentCommentId = this.parent._id || this.parent.id;
    } else {
      // comment on post
      postId = this.parent?._id || this.parent?.id || this.parent?.post?._id || this.parent?.post?.id;
      parentCommentId = undefined;
    }

    this.commentService.createComment(
      {
        postId,
        parentCommentId,
        authorId,
        content: this.content,
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
    })
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