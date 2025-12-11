import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { ConversationRenameModalComponent } from '../conversation-rename-modal/conversation-rename-modal.component';
import { AddParticipantsModalComponent } from '../add-participants-modal/add-participants-modal.component';
import { ParticipantMenuModalComponent } from '../participant-menu-modal/participant-menu-modal.component';
import { AlertService } from '../../state-managements/alert.service';
import { ConversationStateService } from '../../state-managements/conversation-state.service';
import { Router } from '@angular/router';
import { ConfirmModalComponent } from '../confirm-delete-modal/confirm-modal.component';
import { EscToCloseDirective } from '../../directives/esc-to-close.directive';
import { UserService } from '../../../core/services/user.service';
import { ConversationService } from '../../../core/services/conversation.service';
import { ConversationThemeModalComponent } from "../conversation-theme-modal/conversation-theme-modal.component";

@Component({
    selector: 'app-conversation-info-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ClickOutsideModule,
        ConversationRenameModalComponent,
        AddParticipantsModalComponent,
        ParticipantMenuModalComponent,
        ConfirmModalComponent,
        EscToCloseDirective,
        ConversationThemeModalComponent
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

    // add participants modal
    showAddModal = false;
    notifyEnabled = true;
    uploadingAvatar = false;

    // change avatar properties
    selectedAvatarFile: File | null = null;
    selectedAvatarPreview: string | null = null;

    // participants more action properties
    selectedParticipant: any = null;
    showParticipantMenu = false;

    // confirm to leave conversation
    showLeaveConfirm = false;

    // settings dropdown
    @ViewChild('settingsDropdown') settingsDropdownRef?: ElementRef<HTMLElement>;
    @ViewChild('settingsAvatarInput') settingsAvatarInput?: ElementRef<HTMLInputElement>;
    showSettingsMenu = false;
    showChangeThemeModal = false;
    showEditNicknamesModal = false;
    showEmojiPickerModal = false;

    constructor(
        private userService: UserService,
        private conversationService: ConversationService,
        private alertService: AlertService,
        private conversationStateService: ConversationStateService,
        private router: Router,
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
        this.clearAvatarPreview();
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
        this.showAddModal = true;
    }

    onMembersAdded(payload: any) {
        const conv = payload?.conversation ?? payload ?? null;
        if (conv) {
            this.conversation = conv;
            // update participants array if populated
            if (Array.isArray(conv.participantIds) && conv.participantIds.length > 0) {
                this.participants = conv.participantIds;
            } else if (Array.isArray(conv.participants) && conv.participants.length > 0) {
                this.participants = conv.participants;
            }
            this.conversationStateService.setConversation(conv);
            this.conversationStateService.emitAction({ type: 'updated', conversation: conv });
        }
        this.showAddModal = false;
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
                    this.conversationStateService.emitAction({ type: 'updated', conversation: updated });
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
                this.alertService.show("error", "Đã xảy ra lỗi khi cập nhật tên cuộc tròuyện");
            }
        });
    }

    onRenameClosed() {
        this.showRenameModal = false;
    }

    onAvatarSelected(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input?.files || input.files.length === 0) return;
        const file = input.files[0];

        if (!file.type.startsWith('image/')) {
            this.alertService.show("error", "Vui lòng chọn file ảnh hợp lệ!");
            input.value = '';
            return;
        }

        if (this.selectedAvatarPreview) {
            try { URL.revokeObjectURL(this.selectedAvatarPreview); } catch { }
        }

        this.selectedAvatarFile = file;
        this.selectedAvatarPreview = URL.createObjectURL(file);

        input.value = '';
    }

    confirmUploadAvatar() {
        if (!this.selectedAvatarFile) return;

        const convId = this.conversation?.id ?? this.conversation?._id;
        if (!convId) {
            this.alertService.show("error", "Không tìm thấy cuộc trò chuyện để cập nhật ảnh");
            this.clearAvatarPreview();
            return;
        }

        this.uploadingAvatar = true;

        this.conversationService.updateAvatar(convId, this.selectedAvatarFile).subscribe({
            next: (response: any) => {
                const updated = response?.data?.conversation ?? response?.conversation ?? null;
                if (updated) {
                    this.conversationStateService.setConversation(updated);
                    this.conversationStateService.emitAction({ type: 'updated', conversation: updated });
                    this.alertService.show("success", "Ảnh đại diện đã được cập nhật");
                } else {
                    this.alertService.show("error", "Đã xảy ra lỗi khi cập nhật ảnh đại diện");
                }
                this.uploadingAvatar = false;
                this.clearAvatarPreview();
            },
            error: (error: any) => {
                console.error(error);
                this.uploadingAvatar = false;
                this.alertService.show("error", "Đã xảy ra lỗi khi cập nhật ảnh đại diện");
                this.clearAvatarPreview();
            }
        });
    }

    clearAvatarPreview() {
        if (this.selectedAvatarPreview) {
            try { URL.revokeObjectURL(this.selectedAvatarPreview); } catch { }
        }
        this.selectedAvatarFile = null;
        this.selectedAvatarPreview = null;
    }

    deleteChat() { }

    leaveChat() {
        this.showLeaveConfirm = true;
    }

    confirmLeave() {
        const convId = this.conversation?.id ?? this.conversation?._id;
        if (!convId) {
            this.alertService.show('error', 'Không tìm thấy cuộc trò chuyện');
            this.showLeaveConfirm = false;
            return;
        }

        this.conversationService.leaveConversation(convId).subscribe({
            next: (res: any) => {
                const payload = res?.data ?? res;
                const updated = payload?.conversation ?? payload ?? null;

                if (updated) {
                    this.conversation = updated;
                    if (Array.isArray(updated.participantIds) && updated.participantIds.length > 0) {
                        this.participants = updated.participantIds;
                    } else if (Array.isArray(updated.participants) && updated.participants.length > 0) {
                        this.participants = updated.participants;
                    }
                    this.conversationStateService.setConversation(updated);
                    this.conversationStateService.emitAction({ type: 'updated', conversation: updated });
                    try { } catch { }
                    this.alertService.show('success', 'Bạn đã rời khỏi nhóm và cuộc trò chuyện đã bị xóa');
                } else {
                    this.conversationStateService.emitAction({ type: 'removed', id: convId });
                }

                this.showLeaveConfirm = false;
                this.onClose();
            },
            error: (err: any) => {
                const message = err?.error?.message ?? err?.message ?? 'Đã xảy ra lỗi khi rời khỏi nhóm';
                this.alertService.show('error', message);
                this.showLeaveConfirm = false;
            }
        });
    }

    onParticipantMenu(p: any) {
        if (!p) return;
        const id = this._getId(p);
        if (id && id === String(this.currentUserId)) return;
        this.selectedParticipant = p;
        this.showParticipantMenu = true;
    }

    onParticipantActed(event: any) {
        const t = event?.type;
        if (t === 'removed') {
            const updatedConv = event?.conversation ?? null;
            const userId = event?.userId ?? null;

            if (updatedConv) {
                this.conversation = updatedConv;
                if (Array.isArray(updatedConv.participantIds) && updatedConv.participantIds.length > 0) {
                    this.participants = updatedConv.participantIds;
                } else if (Array.isArray(updatedConv.participants) && updatedConv.participants.length > 0) {
                    this.participants = updatedConv.participants;
                }
                this.conversationStateService.setConversation(updatedConv);
                this.conversationStateService.emitAction({ type: 'updated', conversation: updatedConv });
            } else if (userId && String(userId) === String(this.currentUserId)) {
                // removed current user
                this.conversationStateService.emitAction({ type: 'removed', id: this.conversation?.id ?? this.conversation?._id });
                this.onClose();
            } else {
                // someone else removed but no conversation returned; refresh list
                this.conversationStateService.emitAction({ type: 'updated', conversation: this.conversation });
            }
        }

        if (t === 'promoted') {
            if (event.conversation) {
                this.conversation = event.conversation;
                this.conversationStateService.setConversation(this.conversation);
                this.conversationStateService.emitAction({ type: 'updated', conversation: this.conversation });
            } else if (event.userId) {
                // optimistic update: toggle admin badge
            }
        }

        if (t === 'left') {
            if (event.userId) {
                // handle left event if needed
            }
        }

        this.showParticipantMenu = false;
        this.selectedParticipant = null;
    }

    toggleSettingsMenu(event?: Event) {
        if (event) event.stopPropagation();
        this.showSettingsMenu = !this.showSettingsMenu;
    }

    onSettingsRename() {
        this.showSettingsMenu = false;
        this.startEditName();
    }

    onSettingsChangeAvatar() {
        this.showSettingsMenu = false;
        try {
            this.settingsAvatarInput?.nativeElement.click();
        } catch (e) {
            console.warn('Failed to open settings avatar input', e);
        }
    }

    onSettingsChangeTheme() {
        this.showSettingsMenu = false;
        this.showChangeThemeModal = true;
    }

    onSettingsEditNicknames() {
        this.showSettingsMenu = false;
        this.showEditNicknamesModal = true;
    }

    onSettingsChangeEmoji() {
        this.showSettingsMenu = false;
        this.showEmojiPickerModal = true;
    }

    onPanelClick(event: Event) {
        event.stopPropagation();

        if (this.showSettingsMenu) {
            try {
                const dropdownEl = this.settingsDropdownRef?.nativeElement;
                const target = event.target as Node | null;
                if (dropdownEl && target && !dropdownEl.contains(target)) {
                    this.showSettingsMenu = false;
                }
            } catch (e) {
                this.showSettingsMenu = false;
            }
        }
    }

    onThemeSaved(themeType: string) {
        this.showChangeThemeModal = false;
        if (this.conversation) {
            this.conversation.theme = themeType;
        }
    }
}