import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { FormsModule } from '@angular/forms';
import { PostModalComponent } from '../../../shared/components/post-modal/post-modal.component';
import { PostService } from '../../../core/services/post.service';
import { Post } from '../../../shared/interfaces/post.interface';
import { PostEventService } from '../../../shared/state-managements/post-event.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PostComponent,
    FormsModule,
    PostModalComponent,
  ],
  templateUrl: './home.component.html'
})
export class HomeComponent implements OnInit {
  posts: Post[] = [];
  showPostModal = false;
  newPostContent: string = '';

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
    this.postService.getAllPosts().subscribe({
      next: (data) => {
        this.posts = data;
      },
      error: (error) => {
        console.error('Error loading posts:', error);
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