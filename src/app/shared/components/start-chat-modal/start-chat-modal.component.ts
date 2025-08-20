import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { FollowService } from '../../../core/services/follow.service';
import { UserService } from '../../../core/services/user.service';
import { StartChatService } from '../../state-managements/start-chat.service';
import { ConversationService } from '../../../core/services/conversation.service';
import { Router } from '@angular/router';
import { AlertService } from '../../state-managements/alert.service';

@Component({
    selector: 'app-start-chat-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ClickOutsideModule
    ],
    templateUrl: './start-chat-modal.component.html',
    styleUrls: ['./start-chat-modal.component.scss']
})
export class StartChatModalComponent implements OnInit {
    isloading: boolean = false;
    isCreating: boolean = false;
    query: string = '';
    following: any[] = [];
    filtered: any[] = [];
    selectedUsers: any[] = [];

    constructor(
        private followService: FollowService,
        private userService: UserService,
        private startChatService: StartChatService,
        private conversationService: ConversationService,
        private router: Router,
        private alertService: AlertService,
    ) { }

    ngOnInit(): void {
        const user = this.userService.getCurrentUserInfo() || {};
        const userId = (user.id ?? user._id ?? user.username) as string;
        if (!userId) return;

        this.isloading = true;
        this.followService.getFollowing(userId).subscribe({
            next: (res: any) => {
                this.following = Array.isArray(res) ? res : (res?.data ?? res?.results ?? []);
                this.filtered = this.following;
                this.isloading = false;
            },
            error: () => {
                this.following = [];
                this.filtered = [];
                this.isloading = false;
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

    isSelected(u: any) {
        const id = u?.id ?? u?._id ?? u?.username;
        return this.selectedUsers.some(s => (s?.id ?? s?._id ?? s?.username) === id);
    }

    toggleSelection(u: any, evt?: Event) {
        if (evt) evt.stopPropagation();
        const id = u?.id ?? u?._id ?? u?.username;
        const idx = this.selectedUsers.findIndex(s => (s?.id ?? s?._id ?? s?.username) === id);
        if (idx >= 0) {
            this.selectedUsers.splice(idx, 1);
        } else {
            this.selectedUsers.push(u);
        }
    }

    startChat() {
        if (this.selectedUsers.length === 0) return;

        const currentUserInfo = this.userService.getCurrentUserInfo() || {};
        const currentUserId = (currentUserInfo.id ?? currentUserInfo._id) as string;

        const participantIds = [
            ...new Set([
                ...this.selectedUsers.map(s => s?.id ?? s?._id).filter(Boolean),
                currentUserId,
            ]),
        ];

        const isGroup = this.selectedUsers.length > 1;
        const name = isGroup ? `${currentUserInfo.fullName || currentUserInfo.username} và ${this.selectedUsers.length} người khác` : undefined;

        this.isCreating = true;
        this.conversationService.create({ participantIds, isGroup, name }).subscribe({
            next: (response: any) => {
                this.isCreating = false;
                const conv = response?.data ?? response;
                const convId = conv?._id ?? conv?.id ?? null;
                this.startChatService.close();
                if (convId) this.router.navigate(['/inbox', convId]);
                else this.alertService.show("error", "Lỗi khi tạo mới cuộc trò chuyện");
            },
            error: (response: any) => {
                this.alertService.show("error", "Lỗi khi tạo mới cuộc trò chuyện");
                this.isCreating = false;
            }
        })
    }

    onClose() {
        this.startChatService.close();
    }
}