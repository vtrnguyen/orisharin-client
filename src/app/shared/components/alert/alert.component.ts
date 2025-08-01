import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

@Component({
    selector: 'app-alert',
    standalone: true,
    imports: [
        CommonModule,
    ],
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnChanges {
    @Input() type: 'success' | 'error' | 'warning' = 'success';
    @Input() message = '';
    @Input() show = true;
    @Input() duration = 2000;
    @Output() closed = new EventEmitter<void>();

    timeout: any;

    get alertClass() {
        return {
            'bg-green-50 text-green-700 border border-green-200': this.type === 'success',
            'bg-red-50 text-red-700 border border-red-200': this.type === 'error',
            'bg-yellow-50 text-yellow-700 border border-yellow-200': this.type === 'warning',
        };
    }

    get iconClass() {
        if (this.type === 'success') return 'fa-solid fa-circle-check text-green-500';
        if (this.type === 'warning') return 'fa-solid fa-circle-exclamation text-yellow-500';
        if (this.type === 'error') return 'fa-solid fa-circle-xmark text-red-500';
        return '';
    }

    ngOnChanges(changes: SimpleChanges) {
        if ((changes['show'] && this.show) || changes['message'] || changes['type']) {
            clearTimeout(this.timeout);
            if (this.show) {
                this.timeout = setTimeout(() => this.close(), this.duration);
            }
        }
    }

    close() {
        this.show = false;
        this.closed.emit();
        clearTimeout(this.timeout);
    }
}