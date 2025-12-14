import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { isImage, isVideo } from '../../functions/media-type.util';
import { EscToCloseDirective } from '../../directives/esc-to-close.directive';

@Component({
    selector: 'app-revoke-choice-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        EscToCloseDirective,
    ],
    templateUrl: './revoke-choice-modal.component.html',
    styleUrls: ['./revoke-choice-modal.component.scss']
})
export class RevokeChoiceModalComponent {
    @Input() message: any | null = null;
    @Input() title: string = 'Thu hồi tin nhắn';
    @Output() confirm = new EventEmitter<{ forAll: boolean }>();
    @Output() cancel = new EventEmitter<void>();

    selectedOption: 'forAll' | 'forMe' | null = null;

    isVideo = isVideo;
    isImage = isImage;

    onSubmit() {
        if (this.selectedOption === 'forAll') {
            this.confirm.emit({ forAll: true });
        } else if (this.selectedOption === 'forMe') {
            this.confirm.emit({ forAll: false });
        }
    }

    onCancel() {
        this.cancel.emit();
    }
}