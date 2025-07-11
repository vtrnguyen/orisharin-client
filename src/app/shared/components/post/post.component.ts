import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-post',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.scss']
})
export class PostComponent {
    @Input() post: any;

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

    get images() {
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
}
