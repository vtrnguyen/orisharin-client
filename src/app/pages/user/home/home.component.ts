import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
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
}