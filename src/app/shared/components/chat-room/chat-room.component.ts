import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-chat-room',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule
    ],
    templateUrl: './chat-room.component.html',
    styleUrl: './chat-room.component.scss',
})
export class ChatRoomComponent implements OnInit {
    roomId: string | null = null;
    text = '';
    constructor(private route: ActivatedRoute, private router: Router) { }
    ngOnInit() {
        this.roomId = this.route.snapshot.paramMap.get('roomId');
    }
    send() {
        if (!this.text.trim()) return;
        this.text = '';
    }
    back() {
        this.router.navigate(['/inbox']);
    }
}