import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-notification-item',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './notification-item.component.html',
    styleUrls: ['./notification-item.component.scss']
})
export class NotificationItemComponent {
    @Input() noti: any;
    @Input() last: boolean = false;
    @Output() markAsRead = new EventEmitter<string>();

    onClick(): void {
        if (!this.noti.isRead) {
            this.markAsRead.emit(this.noti._id);
        }
    }
}
