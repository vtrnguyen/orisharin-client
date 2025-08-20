import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { FollowService } from '../../../core/services/follow.service';
import { UserService } from '../../../core/services/user.service';
import { StartChatService } from '../../state-managements/start-chat.service';

@Component({
    selector: 'app-start-chat-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ClickOutsideModule],
    templateUrl: './start-chat-modal.component.html',
    styleUrls: ['./start-chat-modal.component.scss']
})
export class StartChatModalComponent implements OnInit {
    @Output() close = new EventEmitter<void>();
    @Output() startConversation = new EventEmitter<any>();

    loading = false;
    query = '';
    following: any[] = [];
    filtered: any[] = [];

    constructor(
        private followService: FollowService,
        private userService: UserService,
        private startChatService: StartChatService
    ) { }

    ngOnInit(): void {
        const user = this.userService.getCurrentUserInfo() || {};
        const userId = (user.id ?? user._id ?? user.username) as string;
        if (!userId) return;

        this.loading = true;
        this.followService.getFollowing(userId).subscribe({
            next: (res: any) => {
                console.log('Following users:', res);
                this.following = Array.isArray(res) ? res : (res?.data ?? res?.results ?? []);
                this.filtered = this.following;
                this.loading = false;
            },
            error: () => {
                this.following = [];
                this.filtered = [];
                this.loading = false;
            }
        });
    }

    applySearch() {
        const q = (this.query || '').trim().toLowerCase();
        if (!q) {
            this.filtered = this.following;
            return;
        }
        this.filtered = this.following.filter(u =>
            (u.username || u.fullName || u.name || '').toLowerCase().includes(q)
        );
    }

    selectUser(u: any) {
        this.startChatService.select(u);
    }

    onClose() {
        this.startChatService.close();
    }
}