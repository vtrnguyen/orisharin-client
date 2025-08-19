import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { CreateCommentComponent } from '../../../shared/components/create-comment/create-comment.component';
import { CommentItemComponent } from '../../../shared/components/comment-item/comment-item.component';
import { PostService } from '../../../core/services/post.service';
import { CommentEventService } from '../../../shared/state-managements/comment-event.service';
import { navigateToProfile } from '../../../shared/functions/navigate-to-profile';
import { AlertService } from '../../../shared/state-managements/alert.service';

@Component({
    selector: 'app-post-detail',
    standalone: true,
    imports: [
        CommonModule,
        PostComponent,
        CreateCommentComponent,
        CommentItemComponent
    ],
    templateUrl: './post-detail.component.html',
    styleUrls: ['./post-detail.component.scss']
})
export class PostDetailComponent implements OnInit {
    post: any = null;
    comments: any[] = [];
    postAuthor: any = null;
    showCommentModal = false;
    selectedParent: any = null;
    isReplyMode = false;

    navigateToProfile = navigateToProfile;

    constructor(
        private route: ActivatedRoute,
        private postService: PostService,
        private commentEventService: CommentEventService,
        private router: Router,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.loadPostDetail();
        this.commentEventService.commentCreated$.subscribe(newComment => {
            if (newComment.postId === (this.post?.id || this.post?._id)) {
                if (newComment.parentCommentId) {
                    const parent = this.comments.find(cmt => cmt._id === newComment.parentCommentId || cmt.id === newComment.parentCommentId);
                    if (parent) {
                        parent.replies = parent.replies || [];
                        parent.replies.push(newComment);
                        parent.commentsCount = (parent.commentsCount || 0) + 1;
                    }
                } else {
                    newComment.replies = [];
                    this.comments.push(newComment);
                }
                if (this.post?.commentsCount !== undefined) this.post.commentsCount++;
            }
        });
    }

    openReplyModal(parent: any) {
        this.selectedParent = parent;
        this.isReplyMode = true;
        this.showCommentModal = true;
    }

    onCommentCreated(newComment: any) {
        if (this.post?.commentsCount !== undefined) this.post.commentsCount++;

        if (newComment.parentCommentId) {
            const parent = this.comments.find(cmt => cmt._id === newComment.parentCommentId || cmt.id === newComment.parentCommentId);
            if (parent) {
                parent.replies = parent.replies || [];
                parent.replies.push(newComment);
            }
        } else {
            this.comments.unshift(newComment);
        }

        this.showCommentModal = false;
        this.selectedParent = null;
        this.isReplyMode = false;
    }

    private loadPostDetail() {
        const postId = this.route.snapshot.paramMap.get('id') ?? '';
        let username = this.route.snapshot.paramMap.get('username') ?? '';

        if (!postId) return;

        if (username.startsWith("@")) {
            username = username.substring(1);
        }

        this.postService.getPostDetail(username, postId).subscribe({
            next: (response: any) => {
                if (response.success && response?.data) {
                    this.post = response.data.post;
                    this.comments = response.data.comments || [];
                    this.postAuthor = response.data.author;
                } else {
                    this.alertService.show('error', 'Bài viết không tồn tại');
                    this.router.navigate(['/not-found']);
                }
            },
            error: (err) => {
                this.alertService.show('error', 'Lỗi khi tải bài viết');
                this.router.navigate(['/']);
            }
        });
    }

    onPostDeleted(postId: string) {
        // try to navigate to author profile if available, otherwise home
        const username =
            this.post?.author?.username ||
            this.post?.author?.userName ||
            this.post?.post?.author?.username;

        if (username) {
            navigateToProfile(this.router, username);
        } else {
            this.router.navigate(['/']);
        }
    }
}