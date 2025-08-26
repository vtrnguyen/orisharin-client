import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { ConversationService } from '../../../core/services/conversation.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { formatTime } from '../../functions/format-time.util';
import { StartChatService } from '../../state-managements/start-chat.service';
import { ConversationStateService } from '../../state-managements/conversation-state.service';

interface ConversationRow {
    conversation: any;
    participants: Array<any>;
    id: string;
    isGroup: boolean;
    title: string;
    avatarUrl?: string;
    lastMessage?: string;
    updatedAt?: string;
    unread?: number;
}

@Component({
    selector: 'app-conversations-list',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './conversations-list.component.html',
    styleUrls: ['./conversations-list.component.scss']
})
export class ConversationsListComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() userId!: string;
    @Input() selected?: any;
    @Output() select = new EventEmitter<any>();

    @ViewChild('scrollContainer', { static: false }) scrollContainer!: ElementRef;
    @ViewChildren('convItem', { read: ElementRef }) convItems!: QueryList<ElementRef>;

    conversations: ConversationRow[] = [];
    page = 1;
    limit = 10;
    loading = false;
    hasMore = true;
    search = '';

    formatTime = formatTime;

    private observer?: IntersectionObserver;
    private sub?: Subscription;
    private convItemsSub?: Subscription;

    private onScrollBound = this.onScroll.bind(this);

    private startChatSub?: Subscription;
    private convStateSub?: Subscription;

    constructor(
        private conversationService: ConversationService,
        private startChatService: StartChatService,
        private conversationStateService: ConversationStateService
    ) { }

    ngOnInit(): void {
        if (!this.userId) return;
        this.loadPage(this.page);

        this.startChatSub = this.startChatService.created$.subscribe((payload: any) => {
            const row = this.mapToRow(payload);
            if (!row || !row.id) return;

            // remove existing if present
            const existingIndex = this.conversations.findIndex(c => String(c.id) === String(row.id));
            if (existingIndex !== -1) {
                this.conversations.splice(existingIndex, 1);
            }
            // prepend
            this.conversations = [row, ...this.conversations];
        });

        this.convStateSub = this.conversationStateService.action$.subscribe((action: any) => {
            if (!action || !action.type) return;

            if (action.type === 'removed' && action.id) {
                const id = String(action.id);
                this.conversations = this.conversations.filter(c => String(c.id) !== id);
                return;
            }

            if (action.type === 'updated' && action.conversation) {
                const updatedConv = action.conversation;
                const id = String(updatedConv.id ?? updatedConv._id);
                const idx = this.conversations.findIndex(c => String(c.id) === id);

                const mappedRow = this.mapToRow({ conversation: updatedConv, participants: updatedConv.participants ?? updatedConv.participantIds });

                if (idx === -1) {
                    this.conversations = [mappedRow, ...this.conversations];
                } else {
                    this.conversations[idx] = mappedRow;
                }
            }
        });
    }

    ngAfterViewInit(): void {
        this.convItemsSub = this.convItems.changes.subscribe(() => {
            this.observeLastItem();
        });
        this.observeLastItem();

        const sc = this.scrollContainer?.nativeElement;
        if (sc && sc.addEventListener) {
            sc.addEventListener('scroll', this.onScrollBound, { passive: true });
        }
    }

    ngOnDestroy(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = undefined;
        }
        const sc = this.scrollContainer?.nativeElement;
        if (sc && sc.removeEventListener) {
            sc.removeEventListener('scroll', this.onScrollBound);
        }

        this.convItemsSub?.unsubscribe();
        this.sub?.unsubscribe();
        this.startChatSub?.unsubscribe();
        this.convStateSub?.unsubscribe();
    }

    private observeLastItem() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = undefined;
        }
        const rootEl = this.scrollContainer?.nativeElement ?? null;
        const items = this.convItems?.toArray() ?? [];
        if (!items.length) return;

        const lastEl = items[items.length - 1].nativeElement;
        try {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;

                    // compute scroll metrics for the scroll container (root)
                    const sc = rootEl;
                    const scrollTop = sc?.scrollTop ?? 0;
                    const clientH = sc?.clientHeight ?? 0;
                    const scrollH = sc?.scrollHeight ?? 0;
                    const nearBottom = (scrollTop + clientH) >= (scrollH - 150);

                    if (scrollTop === 0 && this.page === 1) {
                        return;
                    }

                    if (nearBottom && !this.loading && this.hasMore) {
                        this.page++;
                        this.loadPage(this.page);
                    }
                });
            }, { root: rootEl, rootMargin: '150px', threshold: 0.1 });

            this.observer.observe(lastEl);
        } catch (err) {
            console.warn('Failed to create IntersectionObserver for conversations list', err);
        }
    }

    private onScroll() {
        const el = this.scrollContainer?.nativeElement;
        if (!el || this.loading || !this.hasMore) return;
        const thresholdPx = 150;
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - thresholdPx) {
            if (!this.loading && this.hasMore) {
                this.page++;
                this.loadPage(this.page);
            }
        }
    }

    private mapToRow(it: any): ConversationRow {
        const conv = it?.conversation ?? it ?? {};

        let participants: any[] = it?.participants ?? conv?.participants ?? [];
        if ((!participants || participants.length === 0) && Array.isArray(conv?.participantIds)) {
            participants = conv.participantIds.map((id: any) => ({ id }));
        }

        const other = (participants || []).find((p: any) => String(p.id || p._id) !== String(this.userId));
        const isGroup = !!conv?.isGroup;
        const title = isGroup
            ? (conv?.name || (participants || []).map((p: any) => p.fullName || p.username || String(p.id || p._id)).join(', '))
            : (other?.fullName || other?.username || (other?.id ? ('@' + String(other.id).slice(0, 8)) : 'Người dùng'));

        const avatarCandidate = (conv?.avatarUrl && conv.avatarUrl.trim())
            ? conv.avatarUrl
            : (other?.avatarUrl && other.avatarUrl.trim())
                ? other.avatarUrl
                : (`https://ui-avatars.com/api/?name=${encodeURIComponent(other?.fullName || other?.username || title)}`);

        return {
            conversation: conv,
            participants,
            id: conv?.id ?? conv?._id,
            isGroup,
            title,
            avatarUrl: avatarCandidate,
            lastMessage: conv?.lastMessage ?? '',
            updatedAt: conv?.updatedAt ?? conv?.createdAt ?? new Date().toISOString(),
            unread: conv?.unread ?? 0
        } as ConversationRow;
    }

    loadPage(page: number) {
        if (!this.userId) return;
        if (this.loading) return;
        this.loading = true;
        this.sub = this.conversationService.getByUser(this.userId, page, this.limit)
            .subscribe({
                next: (res: any) => {
                    const payload = res?.data ?? res;
                    const payloadData = payload?.data ?? payload;
                    const items: any[] = Array.isArray(payloadData) ? payloadData : (payloadData?.data ?? []);
                    const metaHasMore = (payload?.hasMore ?? payload?.data?.hasMore) ?? (items.length === this.limit);
                    const mapped = items.map(it => this.mapToRow(it));

                    this.conversations = [...this.conversations, ...mapped];
                    this.hasMore = metaHasMore;
                    this.loading = false;

                    setTimeout(() => this.observeLastItem(), 50);
                },
                error: (err) => {
                    console.error('Load conversations failed', err);
                    this.loading = false;
                    this.hasMore = false;
                }
            });
    }

    filteredConversations() {
        const q = (this.search || '').trim().toLowerCase();
        if (!q) return this.conversations;
        return this.conversations.filter(c => (c.title || '').toLowerCase().includes(q));
    }

    onSelect(conv: ConversationRow) {
        this.select.emit(conv);
    }
}