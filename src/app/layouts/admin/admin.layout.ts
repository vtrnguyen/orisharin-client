import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-admin-layout',
    standalone: true,
    imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
    templateUrl: './admin.layout.html',
    styleUrl: './admin.layout.scss'
})
export class AdminLayoutComponent {
    sidebarCollapsed = false;

    adminNavItems = [
        {
            icon: 'dashboard',
            label: 'Dashboard',
            route: '/admin/dashboard'
        },
        {
            icon: 'users',
            label: 'Users',
            route: '/admin/users'
        },
        {
            icon: 'posts',
            label: 'Posts',
            route: '/admin/posts'
        },
        {
            icon: 'reports',
            label: 'Reports',
            route: '/admin/reports'
        },
        {
            icon: 'settings',
            label: 'Settings',
            route: '/admin/settings'
        }
    ];

    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
    }
}