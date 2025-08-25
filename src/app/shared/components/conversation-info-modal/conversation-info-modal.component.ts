import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClickOutsideModule } from 'ng-click-outside';
import { UserService } from '../../../core/services/user.service';

@Component({
    selector: 'app-conversation-info-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, ClickOutsideModule],
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

    editingName = false;
    nameDraft = '';
    notifyEnabled = true;
    uploadingAvatar = false;

    constructor(
        private userService: UserService
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
        // simple local toggle; persist via API later if needed
        this.notifyEnabled = !this.notifyEnabled;
    }

    startEditName() {
        this.editingName = true;
        this.nameDraft = this.conversation?.name || '';
    }

    addMember() {

    }

    saveName() {
        const v = (this.nameDraft || '').trim();
        // local update only — backend modal/flow will be implemented later
        if (v && this.conversation) {
            this.conversation.name = v;
        }
        this.editingName = false;
    }

    onAvatarSelected(e: Event) {
        // keep hook for later; currently noop
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