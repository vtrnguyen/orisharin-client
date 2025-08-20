import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { formatTime } from '../../../shared/functions/format-time.util';
import { Router, ActivatedRoute, NavigationEnd, RouterOutlet } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { UserService } from '../../../core/services/user.service';
import { StartChatModalComponent } from '../../../shared/components/start-chat-modal/start-chat-modal.component';
import { StartChatService } from '../../../shared/state-managements/start-chat.service';
import { ConversationsListComponent } from '../../../shared/components/conversations-list/conversations-list.component';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    StartChatModalComponent,
    ConversationsListComponent,
  ],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})
export class InboxComponent implements OnInit, OnDestroy {
  search = '';
  conversations: any[] = [
    {
      id: 'c1',
      user: { username: 'alice', fullName: 'Alice Nguyen', avatarUrl: '/images/orisharin_message.png' },
      lastMessage: 'Đã gửi ảnh mới, bạn xem nhé!',
      updatedAt: new Date().toISOString(),
      unread: 2
    },
    {
      id: 'c2',
      user: { username: 'bob', fullName: 'Bob Tran', avatarUrl: '' },
      lastMessage: 'Ok, mình làm ngay.',
      updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      unread: 0
    }
  ];
  userInfo: any;

  selected: any = null;
  private sub?: Subscription;

  showStartChatModal = false;
  private startSub?: Subscription;
  private startSelectSub?: Subscription;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private startChatService: StartChatService
  ) { }

  ngOnInit(): void {
    this.updateSelectedFromRoute();

    this.userInfo = this.userService.getCurrentUserInfo();
    this.sub = this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.updateSelectedFromRoute();
    });

    this.startSub = this.startChatService.show$.subscribe(v => this.showStartChatModal = v);
    this.startSelectSub = this.startChatService.selected$.subscribe(user => {
      const id = user?.id ?? user?._id ?? user?.username;
      if (id) this.router.navigate(['/inbox', id]);
    });
  }

  ngOnDestroy(): void {
    this.startSub?.unsubscribe();
    this.startSelectSub?.unsubscribe();
  }

  filteredConversations() {
    const q = this.search?.trim().toLowerCase();
    if (!q) return this.conversations;
    return this.conversations.filter(c =>
      (c.user.username || '').toLowerCase().includes(q) ||
      (c.user.fullName || '').toLowerCase().includes(q) ||
      (c.lastMessage || '').toLowerCase().includes(q)
    );
  }

  selectConversation(conv: any) {
    this.router.navigate(['/inbox', conv.id]);
  }

  startNewMessage() {
    this.startChatService.open();
  }

  formatTime = formatTime;

  private updateSelectedFromRoute() {
    const url = this.router.url || '';
    const match = url.match(/^\/inbox\/([^\/]+)/);
    const roomId = match && match[1] ? match[1] : null;

    if (!roomId) {
      this.selected = null;
      return;
    }
    const conv = this.conversations.find(c => c.id === roomId);
    this.selected = conv ?? { id: roomId, user: { username: roomId, fullName: roomId }, lastMessage: '', updatedAt: new Date().toISOString() };
  }

  get hasSelected(): boolean {
    const url = this.router.url || '';
    return /^\/inbox\/[^\/]+/.test(url);
  }

  onStartConversation(user: any) {
    this.showStartChatModal = false;
    const id = user?.id ?? user?._id ?? user?.username;
    if (id) {
      this.router.navigate(['/inbox', id]);
    }
  }
}