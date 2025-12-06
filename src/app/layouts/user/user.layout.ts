import { Component, OnDestroy, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { PostModalComponent } from '../../shared/components/post-modal/post-modal.component';
import { ClickOutsideModule } from 'ng-click-outside';
import { AlertService } from '../../shared/state-managements/alert.service';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AlertState } from '../../shared/interfaces/alert.interface';
import { UserService } from '../../core/services/user.service';
import { navigateToProfile } from '../../shared/functions/navigate-to-profile';
import { filter, Subscription } from 'rxjs';

@Component({
    selector: 'app-user-layout',
    standalone: true,
    imports: [
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        CommonModule,
        PostModalComponent,
        ClickOutsideModule,
        AlertComponent,
    ],
    templateUrl: './user.layout.html',
    styleUrl: './user.layout.scss'
})
export class UserLayoutComponent implements OnInit, OnDestroy {
    alertState: AlertState = {
        show: false,
        type: 'success',
        message: '',
        duration: 2500
    };

    userInfo: any;

    showPostModal = false;
    newPostContent = '';

    showUserMenu = false;
    showBottomPanel = false;

    navigateToProfile = navigateToProfile;

    isInbox = false;
    isMobile = false;

    private routerSub?: Subscription;
    private resizeHandler = () => {
        this.isMobile = window.innerWidth <= 768;
    };

    constructor(
        private authService: AuthService,
        public alertService: AlertService,
        private userService: UserService,
        public router: Router
    ) {
        this.alertService.alert$.subscribe(state => this.alertState = state);
        this.userInfo = this.authService.getCurrentUser();
        this.userInfo.avatar = this.userService.getCurrentUserAvatarUrl() || this.userInfo.avatar;
    }

    ngOnInit(): void {
        this.isMobile = window.innerWidth <= 768;
        const url0 = this.router.url || '';
        this.isInbox = /^\/inbox(\/|$)/.test(url0);

        this.routerSub = this.router.events
            .pipe(filter(e => e instanceof NavigationEnd))
            .subscribe(() => {
                const url = this.router.url || '';
                this.isInbox = /^\/inbox(\/|$)/.test(url);
                this.closeBottomPanel();
            });

        window.addEventListener('resize', this.resizeHandler, { passive: true });
    }

    ngOnDestroy(): void {
        this.routerSub?.unsubscribe();
        window.removeEventListener('resize', this.resizeHandler);
        this.setBodyScrollDisabled(false);
    }

    onHomePageClick(): void {
        if (this.router.url === '/' || this.router.url === '') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            this.router.navigate(['/']);
        }
    }

    openPostModal() {
        this.showPostModal = true;
    }

    closePostModal() {
        this.showPostModal = false;
    }

    toggleUserMenu() {
        this.showUserMenu = !this.showUserMenu;
    }

    private setBodyScrollDisabled(disabled: boolean) {
        try {
            document.body.style.overflow = disabled ? 'hidden' : '';
            document.body.style.touchAction = disabled ? 'none' : '';
        } catch (e) { }
    }

    toggleBottomPanel(event?: Event) {
        if (event) event.stopPropagation();
        this.showBottomPanel = !this.showBottomPanel;
        this.setBodyScrollDisabled(this.showBottomPanel);
    }

    closeBottomPanel() {
        this.showBottomPanel = false;
        this.setBodyScrollDisabled(false);
    }

    logout() {
        this.authService.logout();
    }

    navigateToTrash() {
        this.router.navigate(['/trash']);
        this.toggleUserMenu();
        this.closeBottomPanel();
    }

    navigateToInbox() {
        this.router.navigate(['/inbox']);
        this.toggleUserMenu();
        this.closeBottomPanel();
    }
}