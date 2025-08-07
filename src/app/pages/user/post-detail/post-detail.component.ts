import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { CreateCommentComponent } from '../../../shared/components/create-comment/create-comment.component';
import { CommentItemComponent } from '../../../shared/components/comment-item/comment-item.component';
import { PostService } from '../../../core/services/post.service';

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

    constructor(
        private route: ActivatedRoute,
        private postService: PostService,
    ) { }

    ngOnInit() {
        this.loadPostDetail();
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

    private loadPostDetail() {
        const postId = this.route.snapshot.paramMap.get('id');
        if (postId) {
            this.postService.getPostById(postId).subscribe(res => {
                if (res?.data) {
                    this.post = res.data.post;
                    this.comments = res.data.comments || [];
                }
            });
        }
    }
}