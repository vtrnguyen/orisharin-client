import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { isImage, isVideo } from '../../functions/media-type.util';
import { LikeService } from '../../../core/services/like.service';
import { LikeTargetType } from '../../enums/like-target.enums';
import { Router } from '@angular/router';
import { CreateCommentComponent } from '../create-comment/create-comment.component';
import { navigateToProfile } from '../../functions/navigate-to-profile';
import { formatTime } from '../../functions/format-time.util';
import { isOwner } from '../../functions/is-owner';
import { UserService } from '../../../core/services/user.service';
import { ClickOutsideModule } from 'ng-click-outside';
import { AlertService } from '../../state-managements/alert.service';
import { PostService } from '../../../core/services/post.service';
import { ConfirmModalComponent } from '../confirm-delete-modal/confirm-modal.component';

@Component({
    selector: 'app-post',
    standalone: true,
    imports: [
        CommonModule,
        MediaViewerComponent,
        CreateCommentComponent,
        ClickOutsideModule,
        ConfirmModalComponent,
    ],
    templateUrl: './post.component.html',
    styleUrls: ['./post.component.scss']
})
export class PostComponent implements OnInit, OnChanges {
    @Input() post: any;
    @Output() deleted = new EventEmitter<string>(); // optional: optional

    showViewer = false;
    viewerIndex = 0;

    isImage = isImage;
    isVideo = isVideo;
    navigateToProfile = navigateToProfile;
    formatTime = formatTime;
    isOwner = isOwner;

    liked = false;
    likesCount = 0;
    loadingLike = false;

    zoomingIndex: number | null = null;

    showCommentModal: boolean = false;
    isOwnerPost: boolean = false;

    // checking isOwner properties
    currentUserName: string = '';
    postUserName: string = '';

    showPostMenu: boolean = false;

    // delete post properties
    showDeleteConfirm = false;
    isDeleteLoading = false;
    isDeleted = false;

    constructor(
        private likeService: LikeService,
        private userService: UserService,
        public router: Router,
        private alertService: AlertService,
        private postService: PostService,
    ) { }

    ngOnInit() {
        this.currentUserName = this.userService.getCurrentUserInfo().username;
        this.postUserName = this.post.author.username;
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

    togglePostMenu(event: MouseEvent) {
        event.stopPropagation();
        this.showPostMenu = !this.showPostMenu;
    }

    closePostMenu() {
        this.showPostMenu = false;
    }

    onEditPost() {
        this.closePostMenu();
    }

    onDeletePost() {
        this.showDeleteConfirm = true;
    }

    confirmDelete(): void {
        if (!this.post?.id && !this.post?.post.id) return;
        this.isDeleteLoading = true;
        this.postService.deletePost(this.post?.post.id ?? this.post?.id).subscribe({
            next: (res: any) => {
                this.isDeleteLoading = false;
                this.showDeleteConfirm = false;
                this.isDeleted = true; // hide component immediately
                this.deleted.emit(this.post?.post.id ?? this.post?.id); // optional: notify parent to remove from array
                this.alertService.show('success', 'Đã chuyển bài viết vào thùng rác', 3000);
            },
            error: (err) => {
                this.isDeleteLoading = false;
                this.showDeleteConfirm = false;
                console.error('Delete post error', err);
                this.alertService.show('error', 'Xóa bài viết thất bại', 4000);
            }
        });
    }

    onCopyPostUrl() {
        const url = window.location.origin + `/@${this.author.username}/post/${this.post?.post?._id || this.post?.id}`;
        navigator.clipboard.writeText(url).then(() => {
            this.alertService.show('success', 'Đã sao chép đường dẫn bài viết');
        });
        this.closePostMenu();
    }

    onArchivePost() {
        this.closePostMenu();
    }

    onReportPost() {
        this.closePostMenu();
    }

    get author() {
        return this.post.author || {};
    }

    get image() {
        return this.post.post?.mediaUrls?.[0] || null;
    }

    get content() {
        return this.post?.content || this.post?.post?.content || '';
    }

    get createdAt() {
        return this.post?.createdAt || this.post?.post?.createdAt || '';
    }

    get likes() {
        return this.post?.likesCount || this.post?.post?.likesCount || 0;
    }

    get comments() {
        return this.post?.commentsCount || this.post?.post?.commentsCount || 0;
    }

    get reposts() {
        return this.post.post?.repostsCount || 0;
    }

    get shares() {
        return this.post.post?.sharesCount || 0;
    }

    get medias() {
        return this.post?.mediaUrls || this.post?.post?.mediaUrls || [];
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

    navigateToPostDetail(event: MouseEvent): void {
        const target = event.target as HTMLElement;
        if (
            target.closest("button") || target.closest(".no-post-detail")
        ) return;

        const username = this.author.username;
        const postId = this.post?.post?._id || this.post?.id;
        if (username && postId) {
            this.router.navigate([`@${username}`, 'post', postId]);
        }
    }

    onCommentCreated(): void {
        if (this.post?.post) {
            this.post.post.commentsCount = (this.post.post.commentsCount || 0) + 1;
        } else {
            this.post.commentsCount = (this.post.commentsCount || 0) + 1;
        }
        this.showCommentModal = false;
    }
}
