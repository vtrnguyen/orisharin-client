import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StartChatService } from '../../state-managements/start-chat.service';

@Component({
    selector: 'app-inbox-empty',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './inbox-empty.component.html',
    styleUrl: './inbox-empty.component.scss',
})
export class InboxEmptyComponent {
    constructor(private startChat: StartChatService) { }
    startNew() {
        this.startChat.open();
    }
}