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
import { AlertService } from "../../state-managements/alert.service";
import { isImage, isVideo } from "../../functions/media-type.util";
import { MediaViewerComponent } from "../media-viewer/media-viewer.component";
import { ConfirmModalComponent } from "../confirm-delete-modal/confirm-modal.component";
import { Reaction } from "../../enums/reaction.enum";
import { ReactionListModalComponent } from "../reaction-list-modal/reaction-list-modal.component";
import { ConversationInfoModalComponent } from "../conversation-info-modal/conversation-info-modal.component";
import { ConversationStateService } from "../../state-managements/conversation-state.service";

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
        MediaViewerComponent,
        ConfirmModalComponent,
        ReactionListModalComponent,
        ConversationInfoModalComponent
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
    private socketCreatedSub?: Subscription;
    private socketDeletedSub?: Subscription;
    private socketErrSub?: Subscription;
    formatTime = formatTime;
    navigateToProfile = navigateToProfile;
    currentUserId: string | null = null;
    activeActionId: string | null = null;
    isUploading = false;
    isImage = isImage;
    isVideo = isVideo;
    activeMoreMenuId: string | null = null;
    showRevokeConfirm = false;
    selectedMessageToRevoke: any = null;

    // pagination properties
    currentPage = 1;
    pageSize = 20;
    hasMoreMessages = true;
    isLoadingMessages = false;

    // preview media to send
    selectedAttachments: Array<{ file: File; url: string; type: 'image' | 'video' }> = [];

    // media viewer state
    showMediaViewer = false;
    viewerMedias: string[] = [];
    viewerStart = 0;

    // reaction properties
    reactionList = [
        { key: Reaction.Like, emoji: '👍' },
        { key: Reaction.Love, emoji: '❤️' },
        { key: Reaction.Haha, emoji: '😂' },
        { key: Reaction.Wow, emoji: '😮' },
        { key: Reaction.Sad, emoji: '😢' },
        { key: Reaction.Angry, emoji: '😡' }
    ];
    activeReactionPickerId: string | null = null;
    socketReactedSub?: Subscription;
    selectedReactionMessage: any = null;
    showReactionListModal = false;

    // conversation info properties
    showConversationInfoModal = false;
    private convSub?: Subscription;

    @ViewChild("messagesContainer", { static: false }) messagesContainer?: ElementRef;
    @ViewChild("fileInput", { static: false }) fileInput?: ElementRef<HTMLInputElement>;

    constructor(
        private route: ActivatedRoute,
        public router: Router,
        private conversationService: ConversationService,
        public userService: UserService,
        private messageSocketService: MessageSocketService,
        private messageService: MessageService,
        private alertService: AlertService,
        private conversationStateService: ConversationStateService,
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

        this.convSub = this.conversationStateService.conversation$.subscribe(conv => {
            if (!conv) return;
            this.conversation = conv;
            this.isGroup = !!conv.isGroup;
            this.participants = conv.participantIds ?? conv.participants ?? this.participants;
            this.displayName = conv.name ?? this.displayName;
            if (conv.avatarUrl) {
                this.displayAvatar = conv.avatarUrl;
            }
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
        this.socketCreatedSub?.unsubscribe();
        this.socketDeletedSub?.unsubscribe();
        this.socketReactedSub?.unsubscribe();
        this.socketErrSub?.unsubscribe();
        this.convSub?.unsubscribe();
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

        this.socketCreatedSub = this.messageSocketService.onMessageCreated().subscribe((msg: any) => {
            if (msg?.conversationId && String(msg.conversationId) === String(this.roomId)) {
                // avoid duplicates
                if (this.hasMessageId(msg._id)) {
                    // still remove any temp message that matches same sender+content if present
                    this.removeTempMessage(msg.content);
                    return;
                }

                // remove temp by matching content+sender (fallback) and push real msg
                this.removeTempMessage(msg.content);
                this.messages.push(msg);
                setTimeout(() => this.scrollMessagesToBottom(), 50);
            }
        });

        this.socketReactedSub = this.messageSocketService.onMessageReacted().subscribe((payloadObj: any) => {
            // payload may be { payload: { messageId, userId, type, reactionsCount } } or payload itself depending on server
            const payload = payloadObj?.payload ?? payloadObj;
            const messageId = payload?.messageId;
            if (!messageId) return;
            const mIdx = this.messages.findIndex(m => (m._id || m.id) === messageId);
            if (mIdx === -1) return;
            // update reactionsCount and reactions on local message
            const updatedCounts = payload?.reactionsCount ?? {};
            this.messages[mIdx].reactionsCount = updatedCounts;
            // optionally update whole message if server sent it
            if (payload?.message) {
                this.messages[mIdx] = { ...this.messages[mIdx], ...payload.message };
            }
        });

        this.socketDeletedSub = this.messageSocketService.onMessageDeleted().subscribe((payload: any) => {
            const id = payload?.id ?? payload;
            if (!id) return;

            const before = this.messages.length;
            this.messages = this.messages.filter(m => String(m._id ?? m.id) !== String(id));

            if (this.messages.length !== before) {
                this.alertService.show("success", "Người dùng đã thu hồi một tin nhắn.");
            }
        })

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
        if ((!payload && this.selectedAttachments.length === 0) || !this.roomId) return;

        const currentUser = this.userService.getCurrentUserInfo();
        const tempId = "temp-" + Date.now();

        const filesToUpload = this.selectedAttachments.map(a => a.file);
        const previewUrls = this.selectedAttachments.map(a => a.url);
        const previewTypes = this.selectedAttachments.map(a => a.type);

        const tempMsg: any = {
            _id: tempId,
            conversationId: this.roomId,
            content: payload,
            senderId: currentUser?.id || currentUser?._id || currentUser?.userId,
            sentAt: new Date().toISOString(),
            isTemp: true,
            mediaUrls: previewUrls,
            mediaTypes: previewTypes
        };

        this.messages.push(tempMsg);

        this.selectedAttachments = [];
        if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';

        this.text = "";
        setTimeout(() => this.scrollMessagesToBottom(), 50);

        if (filesToUpload.length > 0) {
            this.isUploading = true;

            this.messageService.uploadFiles(this.roomId, filesToUpload, payload).subscribe({
                next: (response: any) => {
                    this.isUploading = false;
                    const payloadData = response?.data ?? response;
                    const created = payloadData?.data ?? payloadData;
                    const msg = created?.message ?? created;

                    try {
                        previewUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) { } });
                    } catch (e) { }

                    if (msg) {
                        this.removeTempMessageById(tempId);

                        if (!this.hasMessageId(msg._id)) {
                            this.messages.push(msg);
                        }
                        setTimeout(() => this.scrollMessagesToBottom(), 50);
                    } else {
                        this.removeTempMessageById(tempId);
                    }
                },
                error: (err) => {
                    this.isUploading = false;
                    try {
                        previewUrls.forEach(u => { try { URL.revokeObjectURL(u); } catch (e) { } });
                    } catch (e) { }

                    this.removeTempMessageById(tempId);
                    this.alertService.show("error", "Failed to upload files");
                }
            });

            return;
        }

        this.messageSocketService.sendMessage({
            conversationId: this.roomId,
            content: payload
        });
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
        this.showConversationInfoModal = true;
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

    onEnterKey(event: Event): void {
        const ke = event as KeyboardEvent;

        if (ke.shiftKey) return;

        ke.preventDefault();

        if (this.isUploading) return;

        const hasText = !!(this.text && this.text.trim());
        const hasAttachments = this.selectedAttachments && this.selectedAttachments.length > 0;

        if (hasText || hasAttachments) {
            this.send();
        }
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

    private _getSenderId(sender: any): string {
        if (!sender) return '';
        if (typeof sender === 'string') return String(sender);
        return String(sender._id ?? sender.id ?? sender);
    }

    shouldShowAvatar(messageIndex: number): boolean {
        const THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

        if (!this.messages || messageIndex < 0 || messageIndex >= this.messages.length) {
            return false;
        }

        const currentMessage = this.messages[messageIndex];
        // if last message, display avatar
        if (messageIndex === this.messages.length - 1) {
            return true;
        }

        const nextMessage = this.messages[messageIndex + 1];
        if (!nextMessage) {
            return true;
        }

        const currSender = this._getSenderId(currentMessage?.senderId);
        const nextSender = this._getSenderId(nextMessage?.senderId);

        // if other senders => show avatar (e.g. A then C then B => A shows)
        if (currSender !== nextSender) {
            return true;
        }

        // same sender: check time difference between 2 messages
        const currTime = currentMessage?.sentAt ? new Date(currentMessage.sentAt).getTime() : 0;
        const nextTime = nextMessage?.sentAt ? new Date(nextMessage.sentAt).getTime() : 0;

        if (!currTime || !nextTime) {
            return false;
        }

        const diff = Math.abs(nextTime - currTime);
        return diff > THRESHOLD_MS;
    }

    shouldShowSenderName(messageIndex: number): boolean {
        const THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes threshold (adjustable)

        if (!this.isGroup) return false;
        if (!this.messages || messageIndex < 0 || messageIndex >= this.messages.length) return false;

        const currentMessage = this.messages[messageIndex];
        // show for first message in list
        if (messageIndex === 0) return true;

        const prevMessage = this.messages[messageIndex - 1];
        if (!prevMessage) return true;

        const currSender = this._getSenderId(currentMessage?.senderId);
        const prevSender = this._getSenderId(prevMessage?.senderId);

        // different sender -> show name
        if (currSender !== prevSender) return true;

        // same sender -> check time gap
        const currTime = currentMessage?.sentAt ? new Date(currentMessage.sentAt).getTime() : 0;
        const prevTime = prevMessage?.sentAt ? new Date(prevMessage.sentAt).getTime() : 0;
        if (!currTime || !prevTime) {
            // if timestamps missing, don't show to keep UI compact
            return false;
        }

        return Math.abs(currTime - prevTime) > THRESHOLD_MS;
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

    isActiveAction(m: any, index: number): boolean {
        return this.activeActionId === this.getMessageActionId(m, index);
    }

    onBubbleClick(m: any, index: number, ev?: Event) {
        if (ev) ev.stopPropagation();
        const id = this.getMessageActionId(m, index);
        this.activeActionId = this.activeActionId === id ? null : id;
    }

    private hasMessageId(id: any): boolean {
        if (!id) return false;
        return this.messages.some(m => String(m._id ?? m.id) === String(id));
    }

    private removeTempMessageById(tempId: string) {
        if (!tempId) return;
        this.messages = this.messages.filter(m => !(String(m._id).startsWith('temp-') && String(m._id) === String(tempId)));
    }

    openMediaViewer(medias: string[] = [], startIndex: number = 0) {
        if (!medias || medias.length === 0) return;
        this.viewerMedias = medias;
        this.viewerStart = startIndex || 0;
        this.showMediaViewer = true;
    }

    closeMediaViewer = () => {
        this.showMediaViewer = false;
        this.viewerMedias = [];
        this.viewerStart = 0;
    }

    toggleMoreMenu(m: any, index: number, ev?: Event) {
        if (ev) ev.stopPropagation();
        const id = this.getMessageActionId(m, index) || (m._id || m.id);
        this.activeMoreMenuId = this.activeMoreMenuId === id ? null : id;
        if (this.activeMoreMenuId) {
        }
    }

    closeMoreMenu() {
        this.activeMoreMenuId = null;
    }

    onCopyMessage(m: any) {
        const text = m.content || '';
        try {
            navigator.clipboard.writeText(text || '');
            this.alertService.show('success', 'Đã sao chép');
        } catch {
            this.alertService.show('error', 'Không thể sao chép');
        }
        this.closeMoreMenu();
    }

    onForwardMessage(m: any) {
        this.alertService.show('warning', 'Chuyển tiếp (chưa triển khai)');
        this.closeMoreMenu();
    }

    onReportMessage(m: any) {
        this.alertService.show('success', 'Đã gửi báo cáo');
        this.closeMoreMenu();
    }

    formatExactSentAt(m: any): string {
        try {
            if (!m?.sentAt) return '';
            const d = new Date(m.sentAt);
            if (isNaN(d.getTime())) return '';

            const pad = (n: number) => String(n).padStart(2, '0');
            const hhmm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

            const now = new Date();
            // compute start of current week (Monday)
            const todayDow = now.getDay(); // 0 = Sun, 1 = Mon, ...
            const diffToMonday = (todayDow + 6) % 7; // days since Monday
            const startOfWeek = new Date(now);
            startOfWeek.setHours(0, 0, 0, 0);
            startOfWeek.setDate(now.getDate() - diffToMonday);

            if (d >= startOfWeek) {
                // within current week -> show weekday short VN style
                const weekdayMap: Record<number, string> = {
                    1: 'T2', // Monday
                    2: 'T3',
                    3: 'T4',
                    4: 'T5',
                    5: 'T6',
                    6: 'T7',
                    0: 'CN'  // Sunday
                };
                const wd = weekdayMap[d.getDay()] || '';
                return `${hhmm} (${wd})`;
            } else {
                // older -> full date with Vietnamese "Tháng"
                const day = d.getDate();
                const month = d.getMonth() + 1;
                const year = d.getFullYear();
                return `${hhmm} ${day} Tháng ${month}, ${year}`;
            }
        } catch {
            return '';
        }
    }

    requestRevokeMessage(m: any, ev?: Event) {
        if (ev) ev.stopPropagation();
        this.selectedMessageToRevoke = m;
        this.showRevokeConfirm = true;
    }

    cancelRevoke() {
        this.showRevokeConfirm = false;
        this.selectedMessageToRevoke = null;
    }

    confirmRevoke() {
        const m = this.selectedMessageToRevoke;
        if (!m) {
            this.cancelRevoke();
            return;
        }
        const id = m._id || m.id;
        if (!id) {
            this.alertService.show('error', 'Tin nhắn không hợp lệ');
            this.cancelRevoke();
            return;
        }

        this.messageService.revoke(id).subscribe({
            next: (res: any) => {
                const ok = res && (res.success === true || res.status === 200 || res);
                if (res && res.success === false) {
                    this.alertService.show('error', res.message || 'Thu hồi thất bại');
                } else {
                    this.messages = this.messages.filter(msg => String(msg._id ?? msg.id) !== String(id));
                    this.alertService.show('success', 'Đã thu hồi tin nhắn');
                }
                this.cancelRevoke();
            },
            error: (err) => {
                console.error('Revoke failed', err);
                this.alertService.show('error', 'Thu hồi thất bại');
                this.cancelRevoke();
            }
        });
    }

    getMessageActionId(m: any, index: number): string {
        return `msg-act-${(m._id || m.id) || index}`;
    }

    toggleReactionPicker(m: any, index: number, ev?: Event) {
        ev?.stopPropagation();
        const id = this.getMessageActionId(m, index);
        this.activeReactionPickerId = this.activeReactionPickerId === id ? null : id;
    }

    closeReactionPicker() {
        this.activeReactionPickerId = null;
    }

    react(m: any, type: string, ev?: Event) {
        ev?.stopPropagation();
        const messageId = m._id || m.id;
        if (!messageId) return;

        this.messageService.react(messageId, type).subscribe({
            next: (res: any) => {
                if (res && res.success && res.data && res.data.message) {
                    const updated = res.data.message;
                    const idx = this.messages.findIndex(x => (x._id || x.id) === messageId);
                    if (idx !== -1) {
                        this.messages[idx] = updated;
                    } else {
                        this.messages.push(updated);
                    }
                }
            },
            error: (err) => {
                this.alertService.show?.('error', 'Không thể bày tỏ cảm xúc');
            }
        });

        this.closeReactionPicker();
    }

    hasReactions(m: any): boolean {
        const rc: Record<string, number> = m?.reactionsCount || {};
        return Object.values(rc).some(v => (v || 0) > 0);
    }

    reactionTypesToShow(m: any): string[] {
        const rc: Record<string, number> = m?.reactionsCount || {};
        const entries = Object.entries(rc)
            .filter(([k, v]) => (v || 0) > 0)
            .sort((a: any, b: any) => (b[1] || 0) - (a[1] || 0))
            .map(e => e[0]);
        return entries.slice(0, 3);
    }

    totalReactions(m: any): number {
        const rc: Record<string, number> = m?.reactionsCount || {};
        return Object.values(rc).reduce((s, v) => s + (v || 0), 0);
    }

    getReactionEmoji(type: string): string {
        const r = this.reactionList.find(x => x.key === type);
        return r ? r.emoji : '👍';
    }

    openReactionList(m: any, ev?: Event) {
        ev?.stopPropagation();
        this.selectedReactionMessage = m;
        this.showReactionListModal = true;
    }

    closeReactionList() {
        this.selectedReactionMessage = null;
        this.showReactionListModal = false;
    }

    private _extractIdFromRef(ref: any): string | null {
        if (!ref) return null;
        if (typeof ref === 'string') return ref;
        return (ref._id ?? ref.id ?? null) || null;
    }

    getUserReactionType(m: any): string | null {
        const uid = this.currentUserId;
        if (!uid || !m?.reactions) return null;
        const found = (m.reactions || []).find((r: any) => {
            const rid = r.userId ?? r.user ?? null;
            const id = this._extractIdFromRef(rid);
            return id && String(id) === String(uid);
        });
        return found ? found.type : null;
    }

    isReactionActive(m: any, type: string): boolean {
        const t = this.getUserReactionType(m);
        return !!t && String(t) === String(type);
    }
}
