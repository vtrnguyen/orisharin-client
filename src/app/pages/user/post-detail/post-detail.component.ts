import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { CreateCommentComponent } from '../../../shared/components/create-comment/create-comment.component';
import { CommentItemComponent } from '../../../shared/components/comment-item/comment-item.component';
import { PostService } from '../../../core/services/post.service';
import { CommentEventService } from '../../../shared/state-managements/comment-event.service';

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
    showCommentModal = false;
    selectedParent: any = null;
    isReplyMode = false;

    constructor(
        private route: ActivatedRoute,
        private postService: PostService,
        private commentEventService: CommentEventService
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
        const postId = this.route.snapshot.paramMap.get('id');
        if (postId) {
            this.postService.getPostById(postId).subscribe(res => {
                if (res?.data) {
                    this.post = res.data.post;
                    this.comments = res.data.comments || [];
                }

                console.log(this.post)
            });
        }
    }
}