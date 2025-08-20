import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { ConversationService } from '../../../core/services/conversation.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { formatTime } from '../../functions/format-time.util';

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

    constructor(private conversationService: ConversationService) { }

    ngOnInit(): void {
        if (!this.userId) return;
        this.loadPage(this.page);
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

                    const mapped = items.map(it => {
                        const conv = it.conversation ?? it;
                        const participants = it.participants ?? it.participantIds ?? [];
                        const other = (participants || []).find((p: any) => String(p.id || p._id) !== String(this.userId));
                        const isGroup = conv.isGroup;
                        const title = isGroup ? (conv.name || participants.map((p: any) => p.fullName || p.username).join(', ')) : (other?.fullName || other?.username || 'Người dùng');
                        const avatarCandidate = (conv.avatarUrl && conv.avatarUrl.trim()) ? conv.avatarUrl : (other?.avatarUrl && other?.avatarUrl.trim() ? other.avatarUrl : (`https://ui-avatars.com/api/?name=${encodeURIComponent(title)}`));

                        return {
                            conversation: conv,
                            participants,
                            id: conv.id ?? conv._id,
                            isGroup,
                            title,
                            avatarUrl: avatarCandidate,
                            lastMessage: conv.lastMessage ?? '',
                            updatedAt: conv.updatedAt,
                            unread: conv.unread ?? 0
                        } as ConversationRow;
                    });

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