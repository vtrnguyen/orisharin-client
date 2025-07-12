import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaViewerComponent } from '../image-viewer/media-viewer.component';
import { isImage, isVideo } from '../../functions/media-type.util';
import { LikeService } from '../../../core/services/like.service';
import { LikeTargetType } from '../../enums/like-target.enums';

@Component({
    selector: 'app-post',
    standalone: true,
    imports: [
        CommonModule,
        MediaViewerComponent,
    ],
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit, OnChanges {
    @Input() post: any;

    showViewer = false;
    viewerIndex = 0;

    isImage = isImage;
    isVideo = isVideo;

    liked = false;
    likesCount = 0;
    loadingLike = false;

    constructor(private likeService: LikeService) { }

    ngOnInit() {
        this.loadLikeInfo();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['post']) {
            this.loadLikeInfo();
        }
    }

    loadLikeInfo() {
        if (!this.post?.post?._id) return;
        this.likeService.getLikes(this.post.post._id, LikeTargetType.Post).subscribe(res => {
            this.liked = res.likedByUser;
            this.likesCount = res.count;
        });
    }

    toggleLike() {
        if (!this.post?.post?._id || this.loadingLike) return;
        this.loadingLike = true;
        if (this.liked) {
            this.likeService.unlike(this.post.post._id, LikeTargetType.Post).subscribe({
                next: () => {
                    this.liked = false;
                    this.likesCount--;
                    this.loadingLike = false;
                },
                error: () => { this.loadingLike = false; }
            });
        } else {
            this.likeService.like(this.post.post._id, LikeTargetType.Post).subscribe({
                next: () => {
                    this.liked = true;
                    this.likesCount++;
                    this.loadingLike = false;
                },
                error: () => { this.loadingLike = false; }
            });
        }
    }


    get author() {
        return this.post.author || {};
    }

    get image() {
        return this.post.post?.mediaUrls?.[0] || null;
    }

    get content() {
        return this.post.post?.content || '';
    }

    get createdAt() {
        return this.post.post?.createdAt || '';
    }

    get likes() {
        return this.post.post?.likesCount || 0;
    }

    get comments() {
        return this.post.post?.commentsCount || 0;
    }

    get reposts() {
        return this.post.post?.repostsCount || 0;
    }

    get shares() {
        return this.post.post?.sharesCount || 0;
    }

    get medias() {
        return this.post.post?.mediaUrls || [];
    }

    formatTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffMonth = Math.floor(diffDay / 30);

        if (diffMin < 1) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay < 30) return `${diffDay} ngày trước`;

        // after 30 days, show the date
        return date.toLocaleDateString('vi-VN');
    }

    openViewer(index: number) {
        this.viewerIndex = index;
        this.showViewer = true;
    }

    closeViewer() {
        this.showViewer = false;
    }
}
