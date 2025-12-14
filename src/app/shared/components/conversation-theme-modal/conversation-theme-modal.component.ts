import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EscToCloseDirective } from '../../directives/esc-to-close.directive';
import { ConversationStateService } from '../../state-managements/conversation-state.service';
import { AlertService } from '../../state-managements/alert.service';
import { ConversationService } from '../../../core/services/conversation.service';
import { CONVERSATION_THEMES } from '../../constants/conversation-themes';

@Component({
    selector: 'app-conversation-theme-modal',
    standalone: true,
    imports: [CommonModule, FormsModule, EscToCloseDirective],
    templateUrl: './conversation-theme-modal.component.html',
    styleUrls: ['./conversation-theme-modal.component.scss'],
})
export class ConversationThemeModalComponent implements OnInit {
    @Input() conversation?: any = null;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<string>();

    selectedType: string = 'default';
    saving = false;

    themes = CONVERSATION_THEMES;

    constructor(
        private conversationService: ConversationService,
        private conversationStateService: ConversationStateService,
        private alertService: AlertService,
    ) { }

    ngOnInit(): void {
        this.selectedType = this.conversation?.theme ?? this.conversation?.themeColor ?? 'default';
    }

    selectTheme(t: string) {
        this.selectedType = t;
    }

    onCancel() {
        this.close.emit();
    }

    onSave() {
        const convId = this.conversation?.id ?? this.conversation?._id;
        if (!convId) {
            this.alertService.show('error', 'Không tìm thấy ID cuộc trò chuyện');
            return;
        }

        this.saving = true;
        this.conversationService.updateTheme(convId, this.selectedType).subscribe({
            next: (res: any) => {
                const updated = res?.data?.conversation ?? res?.conversation ?? res;
                if (updated) {
                    this.conversationStateService.setConversation(updated);
                    this.conversationStateService.emitAction({ type: 'updated', conversation: updated });
                } else {
                    const local = { ...(this.conversation || {}), theme: this.selectedType };
                    this.conversationStateService.setConversation(local);
                    this.conversationStateService.emitAction({ type: 'updated', conversation: local });
                }

                this.saving = false;
                this.saved.emit(this.selectedType);
                this.close.emit();
                this.alertService.show('success', 'Đã cập nhật chủ đề cuộc trò chuyện');
            },
            error: (err: any) => {
                this.saving = false;
                const msg = err?.error?.message ?? err?.message ?? 'Không thể cập nhật chủ đề';
                this.alertService.show('error', msg);
            }
        });
    }
}