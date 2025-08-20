import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';
import { ClickOutsideModule } from 'ng-click-outside';

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

    @ViewChild('fileInput', { static: false }) fileInput?: ElementRef<HTMLInputElement>;

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit() {
        this.sub = this.route.paramMap.subscribe(pm => {
            this.roomId = pm.get('roomId');
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
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
}