import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { UserService } from '../../../core/services/user.service';
import { ConversationRenameModalComponent } from '../conversation-rename-modal/conversation-rename-modal.component';
import { ConversationService } from '../../../core/services/conversation.service';
import { AlertService } from '../../state-managements/alert.service';
import { ConversationStateService } from '../../state-managements/conversation-state.service';

@Component({
    selector: 'app-conversation-info-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ClickOutsideModule,
        ConversationRenameModalComponent
    ],
    templateUrl: './conversation-info-modal.component.html',
    styleUrls: ['./conversation-info-modal.component.scss']
})
export class ConversationInfoModalComponent implements OnInit, OnDestroy {
    @Input() conversation?: any = null;
    @Input() participants: any[] = [];
    @Output() close = new EventEmitter<void>();

    currentUserId: string | null = null;
    isAdmin = false;
    isGroup = false;

    // rename modal properties
    showRenameModal = false;

    notifyEnabled = true;
    uploadingAvatar = false;

    constructor(
        private userService: UserService,
        private conversationService: ConversationService,
        private alertService: AlertService,
        private conversationStateService: ConversationStateService,
    ) { }

    ngOnInit() {
        const u = this.userService.getCurrentUserInfo?.();
        this.currentUserId = u?.id ?? null;

        const ownerId = this._getId(this.conversation?.ownerId ?? this.conversation?.createdBy);
        this.isAdmin = !!ownerId && ownerId === String(this.currentUserId);
        this.isGroup = this.conversation?.isGroup ?? false;

        document.body.style.overflow = 'hidden';
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    private _getId(ref: any): string | null {
        if (!ref) return null;
        if (typeof ref === 'string') return ref;
        return String(ref._id ?? ref.id ?? null);
    }

    isCurrentUser(idRef: any): boolean {
        const id = this._getId(idRef);
        return !!id && id === String(this.currentUserId);
    }

    isOwner(idRef: any): boolean {
        const ownerId = this._getId(this.conversation?.ownerId ?? this.conversation?.createdBy);
        const id = this._getId(idRef);
        return !!ownerId && !!id && ownerId === id;
    }

    onClose() {
        this.close.emit();
    }

    toggleNotify() {
        this.notifyEnabled = !this.notifyEnabled;
    }

    startEditName() {
        this.showRenameModal = true;
    }

    addMember() {

    }

    onRenameSaved(newName: string) {
        if (!this.conversation?.id && !this.conversation?._id) {
            if (this.conversation) this.conversation.name = newName;
            this.showRenameModal = false;
            return;
        }

        const id = this.conversation.id ?? this.conversation._id;
        this.conversationService.updateName(id, newName).subscribe({
            next: (response: any) => {
                const updated = response?.data?.conversation ?? response?.conversation ?? null;
                if (updated) {
                    this.conversationStateService.setConversation(updated);
                    this.alertService.show("success", "Tên cuộc trò chuyện đã được thay đổi");
                } else {
                    this.conversationStateService.updateName(newName);
                    this.alertService.show("error", "Đã xảy ra lỗi khi cập nhật tên cuộc trò chuyện");
                }
                this.showRenameModal = false;
            },
            error: () => {
                this.conversationStateService.updateName(newName);
                this.showRenameModal = false;
                this.alertService.show("error", "Đã xảy ra lỗi khi cập nhật tên cuộc trò chuyện");
            }
        });
    }

    onRenameClosed() {
        this.showRenameModal = false;
    }

    onAvatarSelected(e: Event) {
        const input = e.target as HTMLInputElement;
        if (input) input.value = '';
    }

    deleteChat() {
        // implement via parent / API later
    }

    leaveChat() {
        // implement via parent / API later
    }

    onParticipantMenu(p: any) {
        console.log('participant menu for', p);
    }
}