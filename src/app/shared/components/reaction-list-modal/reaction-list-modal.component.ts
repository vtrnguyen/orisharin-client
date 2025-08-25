import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideModule } from 'ng-click-outside';
import { Reaction } from '../../enums/reaction.enum';
import { navigateToProfile } from '../../functions/navigate-to-profile';
import { Router } from '@angular/router';

@Component({
    selector: 'app-reaction-list-modal',
    standalone: true,
    imports: [CommonModule, ClickOutsideModule],
    templateUrl: './reaction-list-modal.component.html',
    styleUrls: ['./reaction-list-modal.component.scss']
})
export class ReactionListModalComponent implements OnInit {
    @Input() message: any;
    @Output() close = new EventEmitter<void>();

    selectedType: string | null = null;
    reactionMap: Record<string, string> = {
        [Reaction.Like]: '👍',
        [Reaction.Love]: '❤️',
        [Reaction.Haha]: '😂',
        [Reaction.Wow]: '😮',
        [Reaction.Sad]: '😢',
        [Reaction.Angry]: '😡'
    };

    navigateToProfile = navigateToProfile;

    constructor(public router: Router) { }

    ngOnInit() {
        const types = this.getReactionTypes();
        this.selectedType = types.length ? types[0] : null;
    }

    getReactionTypes(): string[] {
        const rc: Record<string, number> = this.message?.reactionsCount || {};
        return Object.entries(rc)
            .filter(([_, v]) => (v || 0) > 0)
            .sort((a, b) => (b[1] || 0) - (a[1] || 0))
            .map(e => e[0]);
    }

    getCounts(): Array<{ type: string; count: number }> {
        const rc: Record<string, number> = this.message?.reactionsCount || {};
        return Object.entries(rc)
            .filter(([_, v]) => (v || 0) > 0)
            .map(([k, v]) => ({ type: k, count: v }));
    }

    usersForType(type: string): any[] {
        if (!this.message?.reactions || !type) return [];
        // reactions array items: { userId: { ...user } , type: 'haha' } (server returns populated user)
        return this.message.reactions
            .filter((r: any) => r?.type === type)
            .map((r: any) => (r.userId && typeof r.userId === 'object') ? r.userId : (r.user && typeof r.user === 'object') ? r.user : null)
            .filter((u: any) => !!u);
    }

    getAvatar(u: any): string {
        if (!u) return '';
        const name = u.fullName || u.username || 'User';
        return (u.avatarUrl && String(u.avatarUrl).trim()) ? u.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    }

    selectType(t: string) {
        this.selectedType = this.selectedType === t ? null : t;
    }

    closeModal() {
        this.close.emit();
    }
}