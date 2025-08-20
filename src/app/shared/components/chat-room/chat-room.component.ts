import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ClickOutsideModule } from 'ng-click-outside';
import { ConversationService } from '../../../core/services/conversation.service';
import { UserService } from '../../../core/services/user.service';

@Component({
    selector: 'app-chat-room',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        PickerComponent,
        ClickOutsideModule,
    ],
    templateUrl: './chat-room.component.html',
    styleUrls: ['./chat-room.component.scss'],
})
export class ChatRoomComponent implements OnInit, OnDestroy {
    roomId: string | null = null;
    text = '';
    showEmojiPicker = false;
    showStickerPicker = false;
    private sub?: Subscription;

    // conversation detail
    conversation: any = null;
    participants: any[] = [];
    displayName = '';
    username = "";
    displayAvatar = '';
    isGroup = false;

    @ViewChild('fileInput', { static: false }) fileInput?: ElementRef<HTMLInputElement>;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private conversationService: ConversationService,
        private userService: UserService
    ) { }

    ngOnInit() {
        this.sub = this.route.paramMap.subscribe(pm => {
            this.roomId = pm.get('roomId');
            if (this.roomId) {
                this.loadConversation(this.roomId);
            } else {
                this.conversation = null;
                this.participants = [];
                this.displayName = '';
                this.displayAvatar = '';
            }
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    private loadConversation(id: string) {
        this.conversationService.getById(id).subscribe({
            next: (res: any) => {
                const payload = res?.data ?? res;
                const data = payload?.data ?? payload;
                const conv = data?.conversation ?? data;
                const participants = data?.participants ?? [];
                this.isGroup = conv?.isGroup || participants.length > 2;

                this.conversation = conv;
                this.participants = participants;

                const currentUser = this.userService.getCurrentUserInfo();
                const currentId = currentUser?.id ?? currentUser?._id ?? currentUser?.userId;

                if (conv?.isGroup) {
                    this.displayName = conv?.name || (participants.map((p: any) => p.fullName || p.username).join(', ') || 'Nhóm');
                    this.displayAvatar = conv?.avatarUrl?.trim()
                        ? conv.avatarUrl
                        : (participants[0]?.avatarUrl?.trim() ? participants[0].avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(this.displayName)}`);
                } else {
                    const other = participants.find((p: any) => String(p.id ?? p._id) !== String(currentId)) ?? participants[0] ?? null;
                    this.displayName = other?.fullName || other?.username || 'Người dùng';
                    this.username = other?.username || 'Người dùng';
                    this.displayAvatar = other?.avatarUrl?.trim() ? other.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(this.displayName)}`;
                }
            },
            error: (err) => {
                console.error('Failed to load conversation', err);
                this.conversation = null;
                this.participants = [];
                this.displayName = this.roomId ?? '';
                this.displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.displayName)}`;
            }
        });
    }

    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    addEmoji(event: any) {
        const em = event?.emoji?.native || event?.emoji || event;
        this.text = (this.text || '') + em;
        this.showEmojiPicker = false;
    }

    openFilePicker() {
        this.fileInput?.nativeElement.click();
    }

    onFileSelected(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;
        const file = input.files[0];
        console.log('Selected file (TODO send):', file);
        input.value = '';
    }

    onStickerSelected(url: string) {
        this.showStickerPicker = false;
        this.text = url;
    }

    startVoiceRecording() {
        console.log('Start voice recording (TODO)');
    }

    openStickerPicker() {
        this.showStickerPicker = !this.showStickerPicker;
    }

    quickHeart() {
        this.text = '❤️';
        this.send();
    }

    send() {
        const payload = (this.text || '').trim();
        if (!payload) return;
        console.log('Send message', { roomId: this.roomId, text: payload });
        this.text = '';
    }

    back() {
        this.router.navigate(['/inbox']);
    }

    autoResize(e: Event) {
        const ta = e.target as HTMLTextAreaElement;
        const MAX_HEIGHT = 160;
        ta.style.height = 'auto';
        const newHeight = Math.min(ta.scrollHeight, MAX_HEIGHT);
        ta.style.height = newHeight + 'px';
        ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? 'auto' : 'hidden';
    }

    callPhone() {
        console.log('Call phone clicked for room', this.roomId);
    }

    callVideo() {
        console.log('Video call clicked for room', this.roomId);
    }

    openConversationInfo() {
        console.log('Open conversation info clicked for room', this.roomId);
    }
}