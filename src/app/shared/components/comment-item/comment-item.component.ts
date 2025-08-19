import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { navigateToProfile } from '../../functions/navigate-to-profile';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { isImage, isVideo } from '../../functions/media-type.util';
import { formatTime } from '../../functions/format-time.util';
import { MentionHighlightPipe } from '../../pipes/mention-hightlight/mention-hightlight.pipe';
import { LikeService } from '../../../core/services/like.service';
import { LikeTargetType } from '../../enums/like-target.enums';

@Component({
    selector: 'app-comment-item',
    standalone: true,
    imports: [
        CommonModule,
        MediaViewerComponent,
        MentionHighlightPipe,
    ],
    templateUrl: './comment-item.component.html',
    styleUrls: ['./comment-item.component.scss']
})
export class CommentItemComponent {
    @Input() comment: any;
    @Output() reply = new EventEmitter<any>();

    liked = false;
    likesCount = 0;
    loadingLike = false;

    // media viewer properties
    showViewer = false;
    viewerIndex = 0;
    zoomingIndex: number | null = null;

    navigateToProfile = navigateToProfile;
    isImage = isImage;
    isVideo = isVideo;
    formatTime = formatTime;

    constructor(public router: Router, private likeService: LikeService) { }

    ngOnInit() {
        this.likesCount = this.comment?.likesCount || 0;
        this.liked = this.comment?.likedByUser || false;
        const id = this.getCommentId();
        if (id) {
            this.likeService.getLikes(id, LikeTargetType.Comment).subscribe({
                next: (res) => {
                    this.likesCount = res.count ?? this.likesCount;
                    this.liked = !!res.likedByUser;
                },
                error: (err) => {
                    console.error('Get likes failed', err);
                }
            });
        }
    }

    toggleLike(event?: MouseEvent) {
        if (event) event.stopPropagation();
        const id = this.getCommentId();
        if (!id || this.loadingLike) return;

        this.loadingLike = true;
        if (this.liked) {
            this.likeService.unlike(id, LikeTargetType.Comment).subscribe({
                next: () => {
                    this.liked = false;
                    this.likesCount = Math.max(0, (this.likesCount || 0) - 1);
                    this.loadingLike = false;
                },
                error: (err) => {
                    console.error('Unlike comment failed', err);
                    this.loadingLike = false;
                }
            });
        } else {
            this.likeService.like(id, LikeTargetType.Comment).subscribe({
                next: () => {
                    this.liked = true;
                    this.likesCount = (this.likesCount || 0) + 1;
                    this.loadingLike = false;
                },
                error: (err) => {
                    console.error('Like comment failed', err);
                    this.loadingLike = false;
                }
            });
        }
    }

    openViewer(index: number) {
        this.zoomingIndex = index;
        setTimeout(() => {
            this.viewerIndex = index;
            this.showViewer = true;
            this.zoomingIndex = null;
        }, 180);
    }

    closeViewer() {
        this.showViewer = false;
    }

    get medias() {
        return this.comment?.mediaUrls || [];
    }

    get isTopLevel(): boolean {
        return !this.comment?.parentCommentId;
    }

    get commentsCount(): number {
        return this.comment?.commentsCount || 0;
    }

    private getCommentId(): string | null {
        return this.comment?._id ?? this.comment?.id ?? this.comment?.comment?._id ?? this.comment?.comment?.id ?? null;
    }
}