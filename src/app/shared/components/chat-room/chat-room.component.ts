import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

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
export class ChatRoomComponent implements OnInit, OnDestroy {
    roomId: string | null = null;
    text = '';
    private sub?: Subscription;

    constructor(private route: ActivatedRoute, private router: Router) { }

    ngOnInit() {
        this.sub = this.route.paramMap.subscribe(pm => {
            this.roomId = pm.get('roomId');
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    send() {
        if (!this.text.trim()) return;
        this.text = '';
    }

    back() {
        this.router.navigate(['/inbox']);
    }
}