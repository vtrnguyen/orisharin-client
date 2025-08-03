import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-comment-item',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './comment-item.component.html',
    styleUrls: ['./comment-item.component.scss']
})
export class CommentItemComponent {
    @Input() comment: any;
    @Output() reply = new EventEmitter<void>();

    liked = false;
    likesCount = 0;

    ngOnInit() {
        this.likesCount = this.comment?.likesCount || 0;
        this.liked = this.comment?.likedByUser || false;
    }

    toggleLike() {
        this.liked = !this.liked;
        this.likesCount += this.liked ? 1 : -1;
    }

    formatTime(dateStr: string): string {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffMin < 1) return 'Vừa xong';
        if (diffMin < 60) return `${diffMin} phút trước`;
        if (diffHour < 24) return `${diffHour} giờ trước`;
        if (diffDay < 30) return `${diffDay} ngày trước`;

        return date.toLocaleDateString('vi-VN');
    }
}