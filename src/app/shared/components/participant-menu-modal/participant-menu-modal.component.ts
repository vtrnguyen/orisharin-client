import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideModule } from 'ng-click-outside';
import { ConversationService } from '../../../core/services/conversation.service';
import { UserService } from '../../../core/services/user.service';
import { AlertService } from '../../state-managements/alert.service';
import { ConfirmModalComponent } from '../confirm-delete-modal/confirm-modal.component';
import { EscToCloseDirective } from '../../directives/esc-to-close.directive';

@Component({
    selector: 'app-participant-menu-modal',
    standalone: true,
    imports: [
        CommonModule,
        ClickOutsideModule,
        ConfirmModalComponent,
        EscToCloseDirective,
    ],
    templateUrl: './participant-menu-modal.component.html',
    styleUrls: ['./participant-menu-modal.component.scss']
})
export class ParticipantMenuModalComponent implements OnInit {
    @Input() conversation?: any | null = null;
    @Input() participant?: any | null = null;
    @Input() isAdmin = false;
    @Input() currentUserId?: string | null = null;

    @Output() close = new EventEmitter<void>();
    @Output() acted = new EventEmitter<any>(); // { type: 'removed'|'promoted'|'blocked'|'left', payload: any }

    loadingAction: boolean = false;

    // confirm to remove properties
    showConfirmRemove = false;

    constructor(
        private conversationService: ConversationService,
        private userService: UserService,
        private alertService: AlertService
    ) { }

    ngOnInit(): void { }

    onClose() {
        this.close.emit();
    }

    async removeFromGroup() {
        this.showConfirmRemove = true;
    }

    confirmRemove() {
        if (!this.conversation || !this.participant) {
            this.showConfirmRemove = false;
            return;
        }
        this.loadingAction = true;
        const convId = this.conversation.id ?? this.conversation._id;
        const userId = this.participant.id ?? this.participant._id;
        if (!convId || !userId) {
            this.loadingAction = false;
            this.showConfirmRemove = false;
            return;
        }

        this.conversationService.removeParticipants(convId, [userId]).subscribe({
            next: (response: any) => {
                this.loadingAction = false;
                const payload = response?.data ?? response;
                const updatedConv = payload?.conversation ?? payload;
                if (updatedConv) {
                    this.alertService.show('success', 'Đã xóa thành viên khỏi nhóm');
                    this.acted.emit({ type: 'removed', conversation: updatedConv, userId });
                } else {
                    this.alertService.show('success', 'Đã xóa thành viên (cập nhật cục bộ)');
                    this.acted.emit({ type: 'removed', userId });
                }
                this.showConfirmRemove = false;
                this.onClose();
            },
            error: (error: any) => {
                this.loadingAction = false;
                this.showConfirmRemove = false;
                this.alertService.show('error', 'Đã xảy ra lỗi khi xóa thành viên');
            }
        });
    }

    promoteToAdmin() {
        // if (!this.conversation || !this.participant) return;
        // this.loadingAction = true;
        // const convId = this.conversation.id ?? this.conversation._id;
        // const userId = this.participant.id ?? this.participant._id;
        // this.conversationService.promoteParticipant(convId, userId).subscribe({
        //   next: (res: any) => {
        //     this.loadingAction = false;
        //     const payload = res?.data ?? res;
        //     const updatedConv = payload?.conversation ?? payload;
        //     if (updatedConv) {
        //       this.alertService.show('success', 'Đã chỉ định làm quản trị viên');
        //       this.acted.emit({ type: 'promoted', conversation: updatedConv, userId });
        //     } else {
        //       this.alertService.show('success', 'Đã chỉ định làm quản trị viên (cập nhật UI cục bộ)');
        //       this.acted.emit({ type: 'promoted', userId });
        //     }
        //     this.onClose();
        //   },
        //   error: (err: any) => {
        //     console.error(err);
        //     this.loadingAction = false;
        //     this.alertService.show('error', 'Lỗi khi chỉ định quản trị viên');
        //   }
        // });
    }

    blockUser() {
        // if (!this.participant) return;
        // this.loadingAction = true;
        // const userId = this.participant.id ?? this.participant._id;
        // // try UserService.blockUser if exists
        // if (this.userService && (this.userService as any).blockUser) {
        //   (this.userService as any).blockUser(userId).subscribe({
        //     next: (res: any) => {
        //       this.loadingAction = false;
        //       this.alertService.show('success', 'Đã chặn người dùng');
        //       this.acted.emit({ type: 'blocked', userId });
        //       this.onClose();
        //     },
        //     error: (err: any) => {
        //       console.error(err);
        //       this.loadingAction = false;
        //       this.alertService.show('error', 'Lỗi khi chặn người dùng');
        //     }
        //   });
        // } else {
        //   // fallback: emit blocked event so parent may handle
        //   this.loadingAction = false;
        //   this.alertService.show('info', 'API chặn không tồn tại, xử lý cục bộ');
        //   this.acted.emit({ type: 'blocked', userId });
        //   this.onClose();
        // }
    }
}