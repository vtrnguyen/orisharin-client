import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { navigateToProfile } from '../../functions/navigate-to-profile';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { isImage, isVideo } from '../../functions/media-type.util';
import { formatTime } from '../../functions/format-time.util';
import { MentionHighlightPipe } from '../../pipes/mention-hightlight/mention-hightlight.pipe';

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
    @Output() reply = new EventEmitter<void>();

    liked = false;
    likesCount = 0;

    // media viewer properties
    showViewer = false;
    viewerIndex = 0;
    zoomingIndex: number | null = null;

    navigateToProfile = navigateToProfile;
    isImage = isImage;
    isVideo = isVideo;
    formatTime = formatTime;

    constructor(public router: Router) { }

    ngOnInit() {
        this.likesCount = this.comment?.likesCount || 0;
        this.liked = this.comment?.likedByUser || false;
    }

    toggleLike() {
        this.liked = !this.liked;
        this.likesCount += this.liked ? 1 : -1;
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
}