import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClickOutsideModule } from 'ng-click-outside';
import { isImage, isVideo } from '../../functions/media-type.util';

@Component({
    selector: 'app-loading',
    standalone: true,
    imports: [
        CommonModule,
        ClickOutsideModule,
    ],
    templateUrl: './loading.component.html',
    styleUrls: ['./loading.component.scss']
})
export class LoadingComponent {
    @Input() message?: string;
}