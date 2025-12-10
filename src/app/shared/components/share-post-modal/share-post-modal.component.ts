import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { PostService } from '../../../core/services/post.service';
import { PostEventService } from '../../state-managements/post-event.service';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../state-managements/alert.service';
import { formatTime } from '../../functions/format-time.util';
import { isImage, isVideo } from '../../functions/media-type.util';
import { navigateToProfile } from '../../functions/navigate-to-profile';
import { Router } from '@angular/router';
import { EscToCloseDirective } from '../../directives/esc-to-close.directive';

@Component({
    selector: 'app-share-post-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ClickOutsideModule,
        EscToCloseDirective,
        // PickerComponent
    ],
    templateUrl: './share-post-modal.component.html',
    styleUrls: ['./share-post-modal.component.scss']
})
export class SharePostModalComponent implements OnInit {
    @Input() originalPost: any; // either the post object or an object containing post
    @Output() close = new EventEmitter<void>();

    content: string = '';
    files: File[] = [];
    images: string[] = [];
    isLoading = false;
    showEmojiPicker = false;
    privacy: 'public' | 'followers' | 'private' = 'public';

    userInfo: any;

    formatTime = formatTime;
    isImage = isImage;
    isVideo = isVideo;
    navigateToProfile = navigateToProfile;

    constructor(
        private postService: PostService,
        private postEventService: PostEventService,
        private userService: UserService,
        private alertService: AlertService,
        public router: Router,
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

    submitShare() {
        if (!this.content.trim() && this.files.length === 0 && !this.originalPost) return;
        this.isLoading = true;
        const origPost = this.originalPost?.post ?? this.originalPost;
        const sharedFromPostId = origPost?.id ?? origPost?._id;

        this.postService.createPost({
            content: this.content,
            files: this.files,
            privacy: this.privacy,
            sharedFromPostId
        }).subscribe({
            next: () => {
                this.isLoading = false;
                this.postEventService.emitPostCreated();
                this.alertService.show('success', 'Đã chia sẻ bài viết');
                this.close.emit();
                this.content = '';
                this.images = [];
                this.files = [];
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Share error', err);
                this.alertService.show('error', 'Đã xảy ra lỗi khi chia sẻ bài viết');
            }
        });
    }

    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    addEmoji(event: any) {
        this.content += event.emoji.native || event.emoji;
    }
}