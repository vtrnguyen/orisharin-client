import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { FollowService } from '../../../core/services/follow.service';
import { UserService } from '../../../core/services/user.service';
import { ConversationService } from '../../../core/services/conversation.service';
import { AlertService } from '../../state-managements/alert.service';
import { ConversationStateService } from '../../state-managements/conversation-state.service';

@Component({
    selector: 'app-add-participants-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ClickOutsideModule],
    templateUrl: './add-participants-modal.component.html',
    styleUrls: ['./add-participants-modal.component.scss']
})
export class AddParticipantsModalComponent implements OnInit {
    @Input() conversation?: any = null;
    @Input() participants: any[] = [];
    @Output() close = new EventEmitter<void>();
    @Output() added = new EventEmitter<any>();

    query = '';
    isLoading = false;
    isAdding = false;

    following: any[] = [];
    filtered: any[] = [];
    selectedUsers: any[] = [];

    constructor(
        private followService: FollowService,
        private userService: UserService,
        private conversationService: ConversationService,
        private alertService: AlertService,
        private conversationStateService: ConversationStateService,
    ) { }

    ngOnInit(): void {
        this.loadFollowing();
        document.body.style.overflow = 'hidden';
    }

    ngOnDestroy(): void {
        document.body.style.overflow = 'auto';
    }

    private loadFollowing() {
        const u = this.userService.getCurrentUserInfo?.() || {};
        const userId = (u.id ?? u._id ?? u.username) as string;
        if (!userId) {
            this.following = [];
            this.filtered = [];
            return;
        }

        this.isLoading = true;
        this.followService.getFollowing(userId).subscribe({
            next: (res: any) => {
                const list = Array.isArray(res) ? res : (res?.data ?? res?.results ?? []);
                // exclude users already in conversation
                const existingIds = new Set((this.conversation?.participantIds ?? this.participants ?? []).map((p: any) => String(p?.id ?? p?._id ?? p)));
                this.following = list.filter((uItem: any) => {
                    const id = String(uItem?.id ?? uItem?._id ?? uItem?.username);
                    return !existingIds.has(id);
                });
                this.filtered = this.following;
                this.isLoading = false;
            },
            error: () => {
                this.following = [];
                this.filtered = [];
                this.isLoading = false;
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
            ((u.username || u.fullName || u.name) + '').toLowerCase().includes(q)
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

    addSelected() {
        if (!this.conversation) {
            this.alertService.show('error', 'Không tìm thấy cuộc trò chuyện');
            return;
        }
        if (this.selectedUsers.length === 0) return;

        const convId = this.conversation.id ?? this.conversation._id;
        const userIds = this.selectedUsers.map(s => String(s?.id ?? s?._id ?? s?.username)).filter(Boolean);

        if (!convId || userIds.length === 0) return;

        this.isAdding = true;
        this.conversationService.addParticipants(convId, userIds).subscribe({
            next: (res: any) => {
                this.isAdding = false;
                const payload = res?.data ?? res;
                const updatedConv = payload?.conversation ?? payload?.data ?? payload;
                if (updatedConv) {
                    // update global state and notify parent
                    this.conversationStateService.setConversation(updatedConv);
                    this.alertService.show('success', 'Đã thêm thành viên vào nhóm');
                    this.added.emit(updatedConv);
                    this.onClose();
                } else {
                    const info = payload ?? res;
                    const added = info?.added ?? [];
                    const skipped = info?.skipped ?? [];
                    const notFound = info?.notFound ?? [];
                    let msg = '';
                    if (added.length) msg += `Đã thêm ${added.length} người. `;
                    if (skipped.length) msg += `${skipped.length} người đã ở trong nhóm. `;
                    if (notFound.length) msg += `${notFound.length} không tìm thấy.`;
                    if (!msg) msg = 'Không thêm được thành viên.';
                    this.alertService.show('error', msg);
                    if (info?.conversation) {
                        this.conversationStateService.setConversation(info.conversation);
                        this.added.emit(info.conversation);
                        this.onClose();
                    }
                }
            },
            error: (err: any) => {
                console.error(err);
                this.isAdding = false;
                this.alertService.show('error', 'Đã xảy ra lỗi khi thêm thành viên');
            }
        });
    }

    onClose() {
        this.close.emit();
    }
}