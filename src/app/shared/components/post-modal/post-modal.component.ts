import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { UserService } from '../../../core/services/user.service';
import { PostService } from '../../../core/services/post.service';
import { isImage } from '../../functions/media-type.util';
import { PostEventService } from '../../state-managements/post-event.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { EscToCloseDirective } from '../../directives/esc-to-close.directive';

@Component({
  selector: 'app-post-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ClickOutsideModule,
    PickerComponent,
    EscToCloseDirective,
  ],
  templateUrl: './post-modal.component.html',
  styleUrls: ['./post-modal.component.scss']
})
export class PostModalComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() avatar: string = '';
  @Input() content: string = '';
  @Output() close = new EventEmitter<void>();

  userInfo: any;
  images: string[] = [];
  files: File[] = [];
  isLoading: boolean = false;
  showEmojiPicker = false;

  isImage = isImage;

  @ViewChild('contentArea') contentArea?: ElementRef<HTMLTextAreaElement>;

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

  ngAfterViewInit(): void {
    setTimeout(() => {
      const el = this.contentArea?.nativeElement;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
      }
    });
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
      next: (response: any) => {
        this.isLoading = false;
        if (response && response.success && response.data) {
          this.postEventService.emitPostCreated(response.data);
        } else {
          this.postEventService.emitPostCreated();
        }
        this.close.emit();
        this.content = '';
        this.images = [];
        this.files = [];
      },
      error: (err) => {
        this.isLoading = false;
      }
    });
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
    this.content += event.emoji.native || event.emoji;
  }
}