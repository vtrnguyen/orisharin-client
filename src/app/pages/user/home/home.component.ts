import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { FormsModule } from '@angular/forms';
import { PostModalComponent } from '../../../shared/components/post-modal/post-modal.component';
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../shared/interfaces/post.interface';
import { PostEventService } from '../../../shared/state-managements/post-event.service';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PostComponent,
    FormsModule,
    PostModalComponent,
    LoadingComponent,
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  posts: Post[] = [];
  showPostModal = false;
  newPostContent: string = '';
  isLoading = true;

  constructor(
    private postService: PostService,
    private postEventService: PostEventService
  ) { }

  ngOnInit() {
    this.loadAllPosts();
    this.postEventService.postCreated$.subscribe(() => {
      this.loadAllPosts();
    });
  }

  loadAllPosts() {
    this.isLoading = true;
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.isLoading = false;
      }
    });
  }

  openPostModal() {
    this.showPostModal = true;
  }

  closePostModal() {
    this.showPostModal = false;
    this.newPostContent = '';
  }

  createPost() {
  }
}