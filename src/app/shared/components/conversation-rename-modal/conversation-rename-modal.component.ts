import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-conversation-rename-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './conversation-rename-modal.component.html',
    styleUrls: ['./conversation-rename-modal.component.scss']
})
export class ConversationRenameModalComponent implements OnInit, AfterViewInit {
    @Input() conversation?: any | null = null;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<string>();

    @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

    name = '';
    saving = false;

    ngOnInit(): void {
        this.name = this.conversation?.name || '';
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            try {
                const el = this.nameInput?.nativeElement;
                if (el) {
                    el.focus();
                    const len = el.value?.length ?? 0;
                    el.setSelectionRange(len, len);
                }
            } catch (e) { }
        }, 0);
    }

    onCancel() {
        this.close.emit();
    }

    onSave() {
        const v = (this.name || '').trim();
        if (!v) return;
        this.saving = true;
        setTimeout(() => {
            this.saving = false;
            this.saved.emit(v);
            this.close.emit();
        }, 200);
    }
}