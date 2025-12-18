import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConversationService } from '../../../core/services/conversation.service';
import { ConversationStateService } from '../../state-managements/conversation-state.service';
import { Subscription } from 'rxjs';
import { PickerComponent } from '@ctrl/ngx-emoji-mart';

@Component({
    selector: 'app-conversation-emoji-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, PickerComponent],
    templateUrl: './conversation-emoji-modal.component.html',
    styleUrls: ['./conversation-emoji-modal.component.scss']
})
export class ConversationEmojiModalComponent implements OnInit, OnDestroy {
    @Input() conversation?: any = null;
    @Output() saved = new EventEmitter<string>();
    @Output() close = new EventEmitter<void>();

    selectedEmoji: string = '';
    saving = false;
    private sub?: Subscription;

    constructor(
        private conversationService: ConversationService,
        private conversationStateService: ConversationStateService,
    ) { }

    ngOnInit(): void {
        this.selectedEmoji = this.conversation?.quickEmoji ?? '';
    }

    ngOnDestroy(): void {
        this.sub?.unsubscribe();
    }

    onEmojiPicked(emoji: { native?: string; colons?: string; unified?: string } | string) {
        if (!emoji) return;
        this.selectedEmoji = (emoji as any).emoji.native ?? '👍';
    }

    onSave() {
        if (!this.conversation || !this.conversation._id) return;

        this.saving = true;
        this.sub = this.conversationService.updateQuickEmoji(String(this.conversation._id), this.selectedEmoji)
            .subscribe({
                next: (res: any) => {
                    this.conversationStateService.update(curr => {
                        if (!curr) return curr;
                        const id = String(curr.id ?? curr._id);
                        if (id !== String(this.conversation?.id ?? this.conversation?._id)) return curr;
                        return { ...curr, quickEmoji: this.selectedEmoji };
                    });
                    this.saving = false;
                    this.saved.emit(this.selectedEmoji);
                },
                error: () => {
                    this.saving = false;
                }
            });
    }

    onCancel() {
        this.close.emit();
    }
}