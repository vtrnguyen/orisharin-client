import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface UserSuggestion {
  avatar: string;
  username: string;
  fullName: string;
  description: string;
  isFollowing: boolean;
}

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
})
export class SearchComponent {
  searchValue = '';
  suggestions: UserSuggestion[] = [
    {
      avatar: 'https://randomuser.me/api/portraits/men/11.jpg',
      username: 'john_doe',
      fullName: 'John Doe',
      description: 'Yêu thích công nghệ, chia sẻ kiến thức.',
      isFollowing: false,
    },
    {
      avatar: 'https://randomuser.me/api/portraits/women/12.jpg',
      username: 'jane_smith',
      fullName: 'Jane Smith',
      description: 'Designer & Creator.',
      isFollowing: false,
    },
    {
      avatar: 'https://randomuser.me/api/portraits/men/13.jpg',
      username: 'alex_nguyen',
      fullName: 'Alex Nguyễn',
      description: 'Lập trình viên, thích Threads.',
      isFollowing: true,
    },
    {
      avatar: 'https://randomuser.me/api/portraits/women/14.jpg',
      username: 'lisa_tran',
      fullName: 'Lisa Trần',
      description: 'Chia sẻ về UI/UX.',
      isFollowing: false,
    },
  ];

  filteredSuggestions: UserSuggestion[] = [...this.suggestions];

  onSearchChange() {
    const value = this.searchValue.trim().toLowerCase();
    if (!value) {
      this.filteredSuggestions = [...this.suggestions];
    } else {
      this.filteredSuggestions = this.suggestions.filter(
        u =>
          u.username.toLowerCase().includes(value) ||
          u.fullName.toLowerCase().includes(value) ||
          u.description.toLowerCase().includes(value)
      );
    }
  }

  toggleFollow(user: UserSuggestion) {
    user.isFollowing = !user.isFollowing;
  }
}