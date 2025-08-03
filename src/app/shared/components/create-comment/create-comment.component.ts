import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { UserService } from '../../../core/services/user.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
  selector: 'app-create-comment',
  standalone: true,
  imports: [CommonModule, FormsModule, ClickOutsideModule, PickerComponent],
  templateUrl: './create-comment.component.html',
  styleUrl: './create-comment.component.scss'
})
export class CreateCommentComponent implements OnInit {
  @Input() parent: any;
  @Output() close = new EventEmitter<void>();
  @Output() commentCreated = new EventEmitter<any>();

  content = '';
  images: string[] = [];
  files: File[] = [];
  isLoading = false;
  showEmojiPicker = false;
  userInfo: any;

  constructor(private userService: UserService) {
    this.userInfo = this.userService.getCurrentUserInfo();
  }

  ngOnInit() {
    console.log('CreateCommentComponent initialized with parent:', this.parent);
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

  submitComment() {
    if (!this.content.trim() && this.files.length === 0) return;
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.commentCreated.emit({ content: this.content, files: this.files });
      this.close.emit();
      this.content = '';
      this.images = [];
      this.files = [];
    }, 1000);
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
}