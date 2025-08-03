import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { CommentService } from '../../../core/services/comment.service';
import { CreateCommentComponent } from '../../../shared/components/create-comment/create-comment.component';
import { CommentItemComponent } from '../../../shared/components/comment-item/comment-item.component';

@Component({
    selector: 'app-post-detail',
    standalone: true,
    imports: [CommonModule, PostComponent, CreateCommentComponent, CommentItemComponent],
    templateUrl: './post-detail.component.html',
    styleUrls: ['./post-detail.component.scss']
})
export class PostDetailComponent implements OnInit {
    post: any = null;
    comments: any[] = [];
    showCommentModal = false;
    selectedParent: any = null;

    constructor(
        private route: ActivatedRoute,
        private commentService: CommentService
    ) { }

    ngOnInit() {
        const postId = this.route.snapshot.paramMap.get('id');
    }

    loadComments(postId: string) {

    }

    openReplyModal(parent: any) {
        this.selectedParent = parent;
        this.showCommentModal = true;
    }

    onCommentCreated() {
        if (this.post?.commentsCount !== undefined) this.post.commentsCount++;
        this.loadComments(this.post.id || this.post._id);
        this.showCommentModal = false;
        this.selectedParent = null;
    }
}