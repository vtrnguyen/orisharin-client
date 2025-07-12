import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { UserService } from '../../../core/services/user.service';
import { PostService } from '../../../core/services/post.service';
import { isImage } from '../../functions/media-type.util';
import { PostEventService } from '../../state-managements/post-event.service';

@Component({
  selector: 'app-post-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClickOutsideModule,
  ],
  templateUrl: './post-modal.component.html',
  styleUrls: ['./post-modal.component.scss']
})
export class PostModalComponent implements OnInit, OnDestroy {
  @Input() avatar: string = '';
  @Input() content: string = '';
  @Output() close = new EventEmitter<void>();

  userInfo: any;
  images: string[] = [];
  files: File[] = [];
  isLoading: boolean = false;

  isImage = isImage;

  constructor(
    private userService: UserService,
    private postService: PostService,
    private postEventService: PostEventService
  ) { }

  ngOnInit() {
    document.body.style.overflow = 'hidden';
    this.userInfo = this.userService.getCurrentUserInfo();
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
        reader.onload = (e: any) => {
          this.images.push(e.target.result);
        };
        reader.readAsDataURL(file);
      });
      input.value = '';
    }
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
    this.files.splice(index, 1);
  }

  submitPost() {
    if (!this.content.trim() && this.files.length === 0) return;
    this.isLoading = true;
    this.postService.createPost({
      content: this.content,
      files: this.files,
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.postEventService.emitPostCreated();
        this.close.emit();
        this.content = '';
        this.images = [];
        this.files = [];
      },
      error: (err) => {
        this.isLoading = false;
        alert("Đăng bài thất bại: " + (err?.error?.message || 'Có lỗi xảy ra!'));
      }
    });
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}