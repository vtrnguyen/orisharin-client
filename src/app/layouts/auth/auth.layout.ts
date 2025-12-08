import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MediaViewerComponent } from '../../shared/components/media-viewer/media-viewer.component';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-auth-layout',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        MediaViewerComponent
    ],
    templateUrl: './auth.layout.html',
    styleUrl: './auth.layout.scss'
})
export class AuthLayoutComponent {
    showQrViewer: boolean = false;
    qrImageUrl = 'images/origintech_qr.png';

    closeQrViewer() {
        this.showQrViewer = false;
    }
}