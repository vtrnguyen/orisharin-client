import { Component, OnDestroy, OnInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { PickerComponent } from "@ctrl/ngx-emoji-mart";
import { ClickOutsideModule } from "ng-click-outside";
import { ConversationService } from "../../../core/services/conversation.service";
import { UserService } from "../../../core/services/user.service";
import { MessageSocketService } from "../../../core/services/message-socket.service";
import { MessageService } from "../../../core/services/message.service";
import { LoadingComponent } from "../loading/loading.component";
import { formatTime } from "../../functions/format-time.util";
import { navigateToProfile } from "../../functions/navigate-to-profile";
import { TooltipComponent } from '../tooltip/tooltip.component';

@Component({
    selector: "app-chat-room",
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        PickerComponent,
        ClickOutsideModule,
        LoadingComponent,
        TooltipComponent,
    ],
    templateUrl: "./chat-room.component.html",
    styleUrls: ["./chat-room.component.scss"],
})
export class ChatRoomComponent implements OnInit, OnDestroy {
    roomId: string | null = null;
    text = "";
    showEmojiPicker = false;
    showStickerPicker = false;
    private sub?: Subscription;

    // conversation detail
    conversation: any = null;
    participants: any[] = [];
    displayName = "";
    username = "";
    displayAvatar = "";
    isGroup = false;

    // message properties
    messages: any[] = [];
    private socketSub?: Subscription;
    private socketErrSub?: Subscription;
    formatTime = formatTime;
    navigateToProfile = navigateToProfile;
    currentUserId: string | null = null;
    activeActionId: string | null = null;

    // pagination properties
    currentPage = 1;
    pageSize = 20;
    hasMoreMessages = true;
    isLoadingMessages = false;

    // preview media to send
    selectedAttachments: Array<{ file: File; url: string; type: 'image' | 'video' }> = [];

    @ViewChild("messagesContainer", { static: false }) messagesContainer?: ElementRef;
    @ViewChild("fileInput", { static: false }) fileInput?: ElementRef<HTMLInputElement>;

    constructor(
        private route: ActivatedRoute,
        public router: Router,
        private conversationService: ConversationService,
        public userService: UserService,
        private messageSocketService: MessageSocketService,
        private messageService: MessageService
    ) { }

    ngOnInit() {
        const currentUserInfo = this.userService.getCurrentUserInfo();
        this.currentUserId = currentUserInfo?.id ?? null;

        this.sub = this.route.paramMap.subscribe(pm => {
            this.roomId = pm.get("roomId");
            if (this.roomId) {
                this.initializeRoom(this.roomId);
            } else {
                this.resetRoom();
            }
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
        this.socketSub?.unsubscribe();
        this.socketErrSub?.unsubscribe();
        this.messageSocketService.disconnect();

        this.selectedAttachments.forEach(a => {
            try { URL.revokeObjectURL(a.url); } catch (e) { }
        });
        this.selectedAttachments = [];
    }

    private initializeRoom(roomId: string) {
        this.resetPagination();
        this.loadConversation(roomId);
        this.loadMessages(roomId, 1, true);
        this.setupSocket();
    }

    private resetRoom() {
        this.conversation = null;
        this.participants = [];
        this.displayName = "";
        this.displayAvatar = "";
        this.messages = [];
        this.resetPagination();
    }

    private resetPagination() {
        this.currentPage = 1;
        this.hasMoreMessages = true;
        this.isLoadingMessages = false;
        this.messages = [];
    }

    private setupSocket() {
        this.messageSocketService.connect();

        this.socketSub = this.messageSocketService.onMessageCreated().subscribe((msg: any) => {
            if (msg?.conversationId && String(msg.conversationId) === String(this.roomId)) {
                this.removeTempMessage(msg.content);
                this.messages.push(msg);
                setTimeout(() => this.scrollMessagesToBottom(), 50);
            }
        });

        this.socketErrSub = this.messageSocketService.onError().subscribe(err => {
            console.error("Socket error", err);
        });
    }

    private loadConversation(id: string) {
        this.conversationService.getById(id).subscribe({
            next: (res: any) => {
                const payload = res?.data ?? res;
                const data = payload?.data ?? payload;
                const conv = data?.conversation ?? data;
                const participants = data?.participants ?? [];
                this.isGroup = conv?.isGroup || participants.length > 2;

                this.conversation = conv;
                this.participants = participants;

                const currentUser = this.userService.getCurrentUserInfo();
                const currentId = currentUser?.id ?? currentUser?._id ?? currentUser?.userId;

                if (conv?.isGroup) {
                    this.displayName = conv?.name || (participants.map((p: any) => p.fullName || p.username).join(", ") || "Nhom");
                    this.displayAvatar = conv?.avatarUrl?.trim()
                        ? conv.avatarUrl
                        : (participants[0]?.avatarUrl?.trim() ? participants[0].avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(this.displayName)}`);
                } else {
                    const other = participants.find((p: any) => String(p.id ?? p._id) !== String(currentId)) ?? participants[0] ?? null;
                    this.displayName = other?.fullName || other?.username;
                    this.username = other?.username;
                    this.displayAvatar = other?.avatarUrl;
                }
            },
            error: (err) => {
                this.conversation = null;
                this.participants = [];
                this.displayName = this.roomId ?? "";
                this.displayAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.displayName)}`;
            }
        });
    }

    private loadMessages(conversationId: string, page: number = 1, isInitial: boolean = false) {
        if (this.isLoadingMessages) return;

        this.isLoadingMessages = true;

        this.messageService.getByConversationPaginated(conversationId, page, this.pageSize).subscribe({
            next: (response: any) => {
                const result = response?.data;
                if (result?.messages) {
                    if (isInitial) {
                        this.messages = result.messages;
                        setTimeout(() => this.scrollMessagesToBottom(), 100);
                    } else {
                        this.messages = [...result.messages, ...this.messages];
                        setTimeout(() => this.maintainScrollPosition(), 50);
                    }

                    this.hasMoreMessages = result.hasMore;
                    this.currentPage = page;
                }
                this.isLoadingMessages = false;
            },
            error: (err) => {
                console.error("Failed to load messages", err);
                this.isLoadingMessages = false;
            }
        });
    }

    loadMoreMessages() {
        if (this.hasMoreMessages && !this.isLoadingMessages && this.roomId) {
            this.loadMessages(this.roomId, this.currentPage + 1, false);
        }
    }

    onScroll(event: Event) {
        const element = event.target as HTMLElement;
        if (element.scrollTop === 0 && this.hasMoreMessages && !this.isLoadingMessages) {
            this.loadMoreMessages();
        }
    }

    private maintainScrollPosition() {
        const el = this.messagesContainer?.nativeElement;
        if (el) {
            const currentScrollHeight = el.scrollHeight;
            const currentScrollTop = el.scrollTop;
            setTimeout(() => {
                const newScrollHeight = el.scrollHeight;
                el.scrollTop = currentScrollTop + (newScrollHeight - currentScrollHeight);
            }, 0);
        }
    }

    private scrollMessagesToBottom() {
        try {
            const el = this.messagesContainer?.nativeElement;
            if (el) el.scrollTop = el.scrollHeight;
        } catch (e) { }
    }

    private removeTempMessage(content: string) {
        const currentUserId = this.userService.getCurrentUserInfo()?.id;
        this.messages = this.messages.filter(msg =>
            !(msg._id?.startsWith("temp-") && msg.content === content && String(msg.senderId) === String(currentUserId))
        );
    }

    send() {
        const payload = (this.text || "").trim();
        if (!payload || !this.roomId) return;

        const currentUser = this.userService.getCurrentUserInfo();
        const tempId = "temp-" + Date.now();

        const tempMsg = {
            _id: tempId,
            conversationId: this.roomId,
            content: payload,
            senderId: currentUser?.id || currentUser?._id || currentUser?.userId,
            sentAt: new Date().toISOString(),
            isTemp: true
        };

        this.messages.push(tempMsg);
        this.text = "";
        setTimeout(() => this.scrollMessagesToBottom(), 50);

        this.messageSocketService.sendMessage({
            conversationId: this.roomId,
            content: payload
        });

        this.selectedAttachments.forEach(a => { try { URL.revokeObjectURL(a.url); } catch (e) { } });
        this.selectedAttachments = [];
    }

    toggleEmojiPicker() {
        this.showEmojiPicker = !this.showEmojiPicker;
    }

    addEmoji(event: any) {
        const em = event?.emoji?.native || event?.emoji || event;
        this.text = (this.text || "") + em;
        this.showEmojiPicker = false;
    }

    openFilePicker() {
        this.fileInput?.nativeElement.click();
    }

    onFileSelected(e: Event) {
        const input = e.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        Array.from(input.files).forEach(file => {
            try {
                const url = URL.createObjectURL(file);
                const type = file.type && file.type.startsWith('video') ? 'video' : 'image';
                this.selectedAttachments.push({ file, url, type });
            } catch (err) {
                console.warn('Failed to create preview for file', err);
            }
        });

        input.value = '';
    }

    removeAttachment(index: number) {
        const att = this.selectedAttachments[index];
        if (!att) return;
        try { URL.revokeObjectURL(att.url); } catch (e) { }
        this.selectedAttachments.splice(index, 1);
    }

    startVoiceRecording() {
        console.log("Start voice recording (TODO)");
    }

    openStickerPicker() {
        this.showStickerPicker = !this.showStickerPicker;
    }

    quickHeart() {
        this.text = "";
        this.send();
    }

    back() {
        this.router.navigate(["/inbox"]);
    }

    autoResize(e: Event) {
        const ta = e.target as HTMLTextAreaElement;
        const MAX_HEIGHT = 160;
        ta.style.height = "auto";
        const newHeight = Math.min(ta.scrollHeight, MAX_HEIGHT);
        ta.style.height = newHeight + "px";
        ta.style.overflowY = ta.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
    }

    callPhone() {
        console.log("Call phone clicked for room", this.roomId);
    }

    callVideo() {
        console.log("Video call clicked for room", this.roomId);
    }

    openConversationInfo() {
        console.log("Open conversation info clicked for room", this.roomId);
    }

    getSenderAvatar(sender: any): string {
        if (!sender) {
            return `https://ui-avatars.com/api/?name=${encodeURIComponent('User')}`;
        }
        if (typeof sender === 'string') {
            const p = this.participants.find((x: any) => String(x.id ?? x._id) === String(sender));
            const name = p?.fullName || p?.username || 'User';
            return (p?.avatarUrl && p?.avatarUrl.trim()) ? p.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
        }
        const name = sender.fullName || sender.username || 'User';
        return (sender.avatarUrl && String(sender.avatarUrl).trim()) ? sender.avatarUrl : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    }

    trackByMessageId(index: number, message: any): string {
        return message._id || message.id || index;
    }

    onEnterKey(event: KeyboardEvent): void {
        event.preventDefault();
        this.send();
    }

    isMessageFromCurrentUser(sender: any): boolean {
        if (!sender) return false;
        const sid = typeof sender === 'string' ? sender : (sender._id ?? sender.id ?? sender);
        return String(sid) === String(this.currentUserId);
    }

    getSenderName(sender: any): string {
        if (!sender) return 'Người dùng';
        if (typeof sender === 'string') {
            const p = this.participants.find((x: any) => String(x.id ?? x._id) === String(sender));
            return p?.fullName || p?.username || 'Người dùng';
        }
        return sender.fullName || sender.username || 'Người dùng';
    }

    shouldShowAvatar(messageIndex: number): boolean {
        if (messageIndex >= this.messages.length - 1) {
            return true;
        }

        const currentMessage = this.messages[messageIndex];
        const nextMessage = this.messages[messageIndex + 1];

        if (this.isMessageFromCurrentUser(currentMessage.senderId)) {
            return false;
        }

        if (!nextMessage ||
            this.isMessageFromCurrentUser(nextMessage.senderId) ||
            String(currentMessage.senderId) !== String(nextMessage.senderId)) {
            return true;
        }

        const currentTime = new Date(currentMessage.sentAt).getTime();
        const nextTime = new Date(nextMessage.sentAt).getTime();
        const timeDiff = Math.abs(nextTime - currentTime);

        if (timeDiff > 5 * 60 * 1000) {
            return true;
        }

        return false;
    }

    shouldShowSenderName(messageIndex: number): boolean {
        if (!this.isGroup) {
            return false;
        }

        if (messageIndex <= 0) {
            return true;
        }

        const currentMessage = this.messages[messageIndex];
        const prevMessage = this.messages[messageIndex - 1];

        if (this.isMessageFromCurrentUser(currentMessage.senderId)) {
            return false;
        }

        if (!prevMessage ||
            this.isMessageFromCurrentUser(prevMessage.senderId) ||
            String(currentMessage.senderId) !== String(prevMessage.senderId)) {
            return true;
        }

        // check time difference
        const currentTime = new Date(currentMessage.sentAt).getTime();
        const prevTime = new Date(prevMessage.sentAt).getTime();
        const timeDiff = Math.abs(currentTime - prevTime);

        if (timeDiff > 5 * 60 * 1000) { // in 5 minutes
            return true;
        }

        return false;
    }

    getMessageMarginBottom(messageIndex: number): string {
        if (messageIndex >= this.messages.length - 1) {
            return '8px'; // last message
        }

        const currentMessage = this.messages[messageIndex];
        const nextMessage = this.messages[messageIndex + 1];

        // if nextMessage is from the same user and within a short time
        if (nextMessage &&
            String(currentMessage.senderId) === String(nextMessage.senderId) &&
            this.isMessageFromCurrentUser(currentMessage.senderId) === this.isMessageFromCurrentUser(nextMessage.senderId)) {

            const currentTime = new Date(currentMessage.sentAt).getTime();
            const nextTime = new Date(nextMessage.sentAt).getTime();
            const timeDiff = Math.abs(nextTime - currentTime);

            if (timeDiff <= 5 * 60 * 1000) { // in 5 minutes
                return '4px';
            }
        }

        return '8px';
    }

    shouldHaveGroupedCorner(messageIndex: number): boolean {
        if (messageIndex >= this.messages.length - 1) {
            return false;
        }

        const currentMessage = this.messages[messageIndex];
        const nextMessage = this.messages[messageIndex + 1];

        // check if next message is from the same user
        if (nextMessage &&
            String(currentMessage.senderId) === String(nextMessage.senderId) &&
            this.isMessageFromCurrentUser(currentMessage.senderId) === this.isMessageFromCurrentUser(nextMessage.senderId)) {

            const currentTime = new Date(currentMessage.sentAt).getTime();
            const nextTime = new Date(nextMessage.sentAt).getTime();
            const timeDiff = Math.abs(nextTime - currentTime);

            // if after 5 minutes then show normal corner
            return timeDiff <= 5 * 60 * 1000;
        }

        return false;
    }

    private getMessageActionId(m: any, index: number): string {
        return String(m?._id ?? m?.id ?? index);
    }

    isActiveAction(m: any, index: number): boolean {
        return this.activeActionId === this.getMessageActionId(m, index);
    }

    onBubbleClick(m: any, index: number, ev?: Event) {
        if (ev) ev.stopPropagation();
        const id = this.getMessageActionId(m, index);
        this.activeActionId = this.activeActionId === id ? null : id;
    }
}
