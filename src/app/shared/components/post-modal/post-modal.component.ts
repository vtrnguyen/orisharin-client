import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { UserService } from '../../../core/services/user.service';
import { PostService } from '../../../core/services/post.service';

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
  @Output() contentChange = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  userInfo: any;
  images: string[] = [];
  isLoading: boolean = false;

  constructor(
    private userService: UserService,
    private postService: PostService
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
  }

  submitPost() {
    if (!this.content.trim() && this.images.length === 0) return;

    this.isLoading = true;
    this.postService.createPost({
      content: this.content,
      mediaUrls: this.images
    }).subscribe({
      next: () => {
        this.isLoading = false;
        this.close.emit();
        this.content = '';
        this.images = [];
        this.contentChange.emit(this.content);
      },
      error: (err) => {
        this.isLoading = false;
        alert("Đăng bài thất bại: " + (err?.error?.message || 'Có lỗi xảy ra!'));
      }
    })
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}