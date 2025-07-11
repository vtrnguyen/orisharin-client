import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { UserService } from '../../../core/services/user.service';

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
  @Output() submit = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  userInfo: any;

  images: string[] = [];

  constructor(
    private userService: UserService
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
      // Reset input để chọn lại cùng ảnh nếu muốn
      input.value = '';
    }
  }

  removeImage(index: number) {
    this.images.splice(index, 1);
  }

  submitPost() {
    // Gửi content và images ra ngoài (bạn có thể emit thêm images nếu muốn)
    this.submit.emit();
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }
}