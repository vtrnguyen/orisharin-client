import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MediaViewerComponent } from '../media-viewer/media-viewer.component';
import { isImage, isVideo } from '../../functions/media-type.util';
import { LikeService } from '../../../core/services/like.service';
import { LikeTargetType } from '../../enums/like-target.enum';
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
import { SharePostModalComponent } from "../share-post-modal/share-post-modal.component";
import { navigateToPost } from '../../functions/navigate-to-post';
import { MentionHighlightPipe } from '../../pipes/mention-hightlight.pipe';
import { DragToScrollDirective } from '../../directives/drag-to-scroll.directive';

@Component({
    selector: 'app-post',
    standalone: true,
    imports: [
        CommonModule,
        MediaViewerComponent,
        CreateCommentComponent,
        ClickOutsideModule,
        ConfirmModalComponent,
        SharePostModalComponent,
        MentionHighlightPipe,
        DragToScrollDirective,
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
    navigateToPost = navigateToPost;

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

    // share post properties
    showShareModal: boolean = false;

    @ViewChild('mediaContainer', { static: false }) mediaContainer?: ElementRef<HTMLDivElement>;
    isDragging = false;
    private dragStartX = 0;
    private scrollStartLeft = 0;
    private dragMoved = false;

    @ViewChild('sharedMediaContainer', { static: false }) sharedMediaContainer?: ElementRef<HTMLDivElement>;
    isDraggingShared = false;
    private sharedDragStartX = 0;
    private sharedScrollStartLeft = 0;
    private dragMovedShared = false;

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
                this.alertService.show('success', 'Đã chuyển bài viết vào thùng rác', 3500, 'Đi đến thùng rác', "trash");
            },
            error: (err) => {
                this.isDeleteLoading = false;
                this.showDeleteConfirm = false;
                console.error('Delete post error', err);
                this.alertService.show('error', 'Xóa bài viết thất bại');
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

    get isShared() {
        const p = this.post?.post ?? this.post;
        return !!(p?.sharedFromPost || p?.sharedFromPostId || p?.sharedFrom);
    }

    get sharedPost() {
        const p = this.post?.sharedPost;
        return p;
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

    openShareModal(): void {
        this.showShareModal = true;
    }

    onDragStart(e: MouseEvent) {
        const el = this.mediaContainer?.nativeElement;
        if (!el) return;
        if (e.button !== 0) return; // chỉ nút trái
        this.isDragging = true;
        this.dragMoved = false; // reset
        el.classList.add('dragging');
        const rect = el.getBoundingClientRect();
        this.dragStartX = e.clientX - rect.left;
        this.scrollStartLeft = el.scrollLeft;
        e.preventDefault();
    }

    onDragMove(e: MouseEvent) {
        if (!this.isDragging) return;
        const el = this.mediaContainer?.nativeElement;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const walk = x - this.dragStartX; // positive -> dragged right
        // nếu di chuyển vượt threshold nhỏ thì coi là drag
        if (Math.abs(walk) > 3) this.dragMoved = true;
        el.scrollLeft = this.scrollStartLeft - walk;
        e.preventDefault();
    }

    onDragEnd() {
        if (!this.isDragging) {
            this.dragMoved = false;
            return;
        }
        this.isDragging = false;
        const el = this.mediaContainer?.nativeElement;
        if (el) el.classList.remove('dragging');
    }

    onTouchStart(e: TouchEvent) {
        const el = this.mediaContainer?.nativeElement;
        if (!el) return;
        this.isDragging = true;
        this.dragMoved = false;
        el.classList.add('dragging');
        const rect = el.getBoundingClientRect();
        const touch = e.touches[0];
        this.dragStartX = touch.clientX - rect.left;
        this.scrollStartLeft = el.scrollLeft;
    }

    onTouchMove(e: TouchEvent) {
        if (!this.isDragging) return;
        const el = this.mediaContainer?.nativeElement;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const walk = x - this.dragStartX;
        if (Math.abs(walk) > 3) this.dragMoved = true;
        el.scrollLeft = this.scrollStartLeft - walk;
        e.preventDefault();
    }

    onMediaClick(index: number, ev: MouseEvent) {
        if (this.dragMoved) {
            ev.preventDefault();
            ev.stopPropagation();
            this.dragMoved = false;
            return;
        }
        this.openViewer(index);
    }

    onSharedDragStart(e: MouseEvent) {
        const el = this.sharedMediaContainer?.nativeElement;
        if (!el) return;
        if (e.button !== 0) return;
        this.isDraggingShared = true;
        this.dragMovedShared = false;
        el.classList.add('dragging');
        const rect = el.getBoundingClientRect();
        this.sharedDragStartX = e.clientX - rect.left;
        this.sharedScrollStartLeft = el.scrollLeft;
        e.preventDefault();
    }

    onSharedDragMove(e: MouseEvent) {
        if (!this.isDraggingShared) return;
        const el = this.sharedMediaContainer?.nativeElement;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const walk = x - this.sharedDragStartX;
        if (Math.abs(walk) > 3) this.dragMovedShared = true;
        el.scrollLeft = this.sharedScrollStartLeft - walk;
        e.preventDefault();
    }

    onSharedDragEnd() {
        if (!this.isDraggingShared) {
            this.dragMovedShared = false;
            return;
        }
        this.isDraggingShared = false;
        const el = this.sharedMediaContainer?.nativeElement;
        if (el) el.classList.remove('dragging');
    }

    onSharedTouchStart(e: TouchEvent) {
        const el = this.sharedMediaContainer?.nativeElement;
        if (!el) return;
        this.isDraggingShared = true;
        this.dragMovedShared = false;
        el.classList.add('dragging');
        const rect = el.getBoundingClientRect();
        const touch = e.touches[0];
        this.sharedDragStartX = touch.clientX - rect.left;
        this.sharedScrollStartLeft = el.scrollLeft;
    }

    onSharedTouchMove(e: TouchEvent) {
        if (!this.isDraggingShared) return;
        const el = this.sharedMediaContainer?.nativeElement;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const walk = x - this.sharedDragStartX;
        if (Math.abs(walk) > 3) this.dragMovedShared = true;
        el.scrollLeft = this.sharedScrollStartLeft - walk;
        e.preventDefault();
    }

    onSharedMediaClick(index: number, ev: MouseEvent) {
        if (this.dragMovedShared) {
            ev.preventDefault();
            ev.stopPropagation();
            this.dragMovedShared = false;
            return;
        }
        ev.stopPropagation();
        const username = this.sharedPost?.author?.username;
        const postId = this.sharedPost?.post?._id;
        if (username && postId) {
            this.router.navigate([`@${username}`, 'post', postId]);
        }
    }
}
