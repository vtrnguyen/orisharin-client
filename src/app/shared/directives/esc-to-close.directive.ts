import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[appEscClose]',
    standalone: true
})
export class EscToCloseDirective {
    @Output() appEscClose = new EventEmitter<void>();

    @HostListener('document:keydown.escape')
    onEscPress() {
        this.appEscClose.emit();
    }
}
