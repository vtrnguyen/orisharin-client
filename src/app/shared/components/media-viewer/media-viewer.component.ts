import { Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideModule } from 'ng-click-outside';
import { isImage, isVideo } from '../../functions/media-type.util';
import { EscToCloseDirective } from '../../directives/esc-to-close.directive';

@Component({
    selector: 'app-media-viewer',
    standalone: true,
    imports: [
        CommonModule,
        ClickOutsideModule,
        EscToCloseDirective,
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
}