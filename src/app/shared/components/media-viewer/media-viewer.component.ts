import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideModule } from 'ng-click-outside';
import { isImage, isVideo } from '../../functions/media-type.util';

@Component({
    selector: 'app-media-viewer',
    standalone: true,
    imports: [
        CommonModule,
        ClickOutsideModule,
    ],
    templateUrl: './media-viewer.component.html',
    styleUrls: ['./media-viewer.component.scss']
})
export class MediaViewerComponent implements OnInit, OnDestroy {
    @Input() medias: string[] = [];
    @Input() startIndex: number = 0;
    @Input() onClose: () => void = () => { };

    current = 0;

    isImage = isImage;
    isVideo = isVideo;

    ngOnInit() {
        this.current = this.startIndex || 0;
        document.body.style.overflow = 'hidden';
    }

    ngOnDestroy() {
        document.body.style.overflow = 'auto';
    }

    prev(): void {
        this.current = (this.current - 1 + this.medias.length) % this.medias.length;
    }

    next(): void {
        this.current = (this.current + 1) % this.medias.length;
    }

    close(): void {
        this.onClose();
    }

    @HostListener('window:keydown', ['$event'])
    onWindowKeydown(e: KeyboardEvent): void {
        if (!this.medias || this.medias.length === 0) return;

        const key = e.key;

        switch (key) {
            case 'ArrowRight':
            case 'ArrowUp':
                if (this.current < this.medias.length - 1) {
                    this.next();
                    e.preventDefault();
                }
                break;
            case 'ArrowLeft':
            case 'ArrowDown':
                if (this.current > 0) {
                    this.prev();
                    e.preventDefault();
                }
                break;
            case 'Escape':
                this.close();
                e.preventDefault();
                break;
            default:
                break;
        }
    }
}