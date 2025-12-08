import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { navigateToProfile } from '../../functions/navigate-to-profile';
import { Router } from '@angular/router';

@Component({
    selector: 'app-user-list-item',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './user-list-item.component.html',
    styleUrls: ['./user-list-item.component.scss']
})
export class UserListItemComponent {
    @Input() user: any;
    @Input() currentUserId?: string;
    @Input() showFollowButton: boolean = true;
    @Output() follow = new EventEmitter<void>();
    @Output() unfollow = new EventEmitter<void>();

    navigateToProfile = navigateToProfile;

    constructor(public router: Router) { }

    onFollow() {
        this.follow.emit();
    }

    onUnfollow() {
        this.unfollow.emit();
    }

    goToProfile() {
        navigateToProfile(this.router, this.user?.username);
    }
}