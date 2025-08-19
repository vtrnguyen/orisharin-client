import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
    {
        path: 'auth',
        loadComponent: () => import('./layouts/auth/auth.layout').then(m => m.AuthLayoutComponent),
        children: [
            {
                path: '',
                redirectTo: 'login',
                pathMatch: 'full'
            },
            {
                path: 'login',
                loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent),
                title: "OriSharin - Đăng nhập"
            },
            {
                path: 'register',
                loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent),
                title: "OriSharin - Đăng ký tài khoản"
            },
        ]
    },

    {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./layouts/admin/admin.layout').then(m => m.AdminLayoutComponent),
        children: [
            {
                path: '',
                redirectTo: 'dashboard',
                pathMatch: 'full'
            },
            {
                path: 'dashboard',
                loadComponent: () => import('./pages/admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
                title: "Dashboard"
            },
        ]
    },

    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layouts/user/user.layout').then(m => m.UserLayoutComponent),
        children: [
            {
                path: '',
                loadComponent: () => import('./pages/user/home/home.component').then(m => m.HomeComponent),
                title: "OriSharin - Trang chủ"
            },
            {
                path: 'notifications',
                loadComponent: () => import('./pages/user/notification/notification.component').then(m => m.NotificationComponent),
                title: "OriSharin - Thông báo"
            },
            {
                path: 'search',
                loadComponent: () => import('./pages/user/search/search.component').then(m => m.SearchComponent),
                title: "OriSharin - Tìm kiếm"
            },
            {
                path: 'inbox',
                loadComponent: () => import('./pages/user/inbox/inbox.component').then(m => m.InboxComponent),
                title: "OriSharin - Hộp thư",
                children: [
                    {
                        path: '',
                        loadComponent: () => import('./shared/components/inbox-empty/inbox-empty.component').then(m => m.InboxEmptyComponent),
                    },
                    {
                        path: ':roomId',
                        loadComponent: () => import('./shared/components/chat-room/chat-room.component').then(m => m.ChatRoomComponent),
                    }
                ]
            },
            {
                path: 'notification',
                loadComponent: () => import('./pages/user/notification/notification.component').then(m => m.NotificationComponent),
                title: "OriSharin - Thông báo"
            },
            {
                path: 'trash',
                loadComponent: () => import('./pages/user/trash/trash.component').then(m => m.TrashComponent),
                title: "OriSharin - Thùng rác"
            },
            {
                path: 'not-found',
                loadComponent: () => import('./pages/error/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent),
                title: "Không tìm thấy trang"
            },
            {
                path: ':username/post/:id',
                loadComponent: () => import('./pages/user/post-detail/post-detail.component').then(m => m.PostDetailComponent),
                title: "Bài đăng"
            },
            {
                path: ':fullname',
                loadComponent: () => import('./pages/user/profile/profile.component').then(m => m.ProfileComponent),
                title: "Trang cá nhân"
            }
        ]
    },

    {
        path: '**',
        loadComponent: () => import('./pages/error/page-not-found/page-not-found.component').then(m => m.PageNotFoundComponent)
    }
];