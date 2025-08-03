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
        // TODO: Gọi API like/unlike comment
    }
}