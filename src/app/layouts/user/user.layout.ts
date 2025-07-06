import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
    selector: 'app-user-layout',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './user.layout.html',
    styleUrl: './user.layout.scss'
})
export class UserLayoutComponent {
    navigationItems = [
        { icon: 'home', label: 'Home', route: '/home', active: false },
        { icon: 'search', label: 'Search', route: '/search', active: false },
        { icon: 'edit', label: 'Create', route: '/create', active: false },
        { icon: 'heart', label: 'Activity', route: '/activity', active: false },
        { icon: 'user', label: 'Profile', route: '/profile', active: false }
    ];

    user = {
        name: '',
        username: '',
        avatar: 'https://via.placeholder.com/40'
    };

    constructor(private authService: AuthService) {
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
            this.user.name = currentUser.fullName;
            this.user.username = '@' + currentUser.username;
        }
    }
}