import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ClickOutsideModule } from 'ng-click-outside';

@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [
        CommonModule,
        ClickOutsideModule,
    ],
    templateUrl: './confirm-modal.component.html',
    styleUrls: ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {
    @Input() title: string = '';
    @Input() message: string = 'Bạn có chắc muốn thực hiện thao tác này?';
    @Input() confirmText: string = 'Xác nhận';
    @Input() cancelText: string = 'Hủy';
    @Input() confirmColor: string = 'text-red-600';
    @Input() imageUrl?: string;
    @Input() show: boolean = true;

    @Output() confirm = new EventEmitter<void>();
    @Output() cancel = new EventEmitter<void>();
}