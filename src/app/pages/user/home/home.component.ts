import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostComponent } from '../../../shared/components/post/post.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    PostComponent,
    FormsModule,
  ],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  posts = [
    {
      id: 1,
      author: {
        fullName: 'Origin Dev',
        username: 'origindev',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      content: 'Chào mừng bạn đến với OriSharin! Đây là bài viết đầu tiên.',
      image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
      createdAt: new Date(),
      comments: 3,
      likes: 12,
      reposts: 2,
      shares: 1
    },
    {
      id: 2,
      author: {
        fullName: 'Jane Doe',
        username: 'janedoe',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg'
      },
      content: 'OriSharin thật tuyệt vời! Mọi người cùng chia sẻ nhé.',
      image: '',
      createdAt: new Date(),
      comments: 1,
      likes: 5,
      reposts: 0,
      shares: 0
    }
  ];
  showPostModal = false;
  newPostContent = '';

  openPostModal() {
    this.showPostModal = true;
  }

  closePostModal() {
    this.showPostModal = false;
    this.newPostContent = '';
  }

  createPost() {
    if (!this.newPostContent.trim()) return;
    this.posts.unshift({
      id: Date.now(),
      author: {
        fullName: 'Origin Dev',
        username: 'origindev',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
      },
      content: this.newPostContent,
      image: '',
      createdAt: new Date(),
      comments: 0,
      likes: 0,
      reposts: 0,
      shares: 0
    });
    this.closePostModal();
  }
}