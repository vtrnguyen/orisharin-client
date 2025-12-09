import { Directive, ElementRef, HostListener, inject } from '@angular/core';

@Directive({
    selector: '[appDragToScroll]',
    standalone: true
})
export class DragToScrollDirective {
    private el = inject(ElementRef<HTMLElement>).nativeElement;
    private isDragging = false;
    private startX = 0;
    private startScroll = 0;
    private dragMoved = false;
    private threshold = 3; // pixels

    constructor() {
        // capture-phase click listener to block clicks after dragging
        this.el.addEventListener('click', (ev: Event) => {
            if (this.dragMoved) {
                ev.preventDefault();
                ev.stopImmediatePropagation();
                this.dragMoved = false; // reset
            }
        }, true); // capture=true so we intercept before child handlers
    }

    // mouse
    @HostListener('mousedown', ['$event'])
    onMouseDown(e: MouseEvent) {
        if (e.button !== 0) return;
        this.isDragging = true;
        this.dragMoved = false;
        this.el.classList.add('dragging');
        const rect = this.el.getBoundingClientRect();
        this.startX = e.clientX - rect.left;
        this.startScroll = this.el.scrollLeft;
        e.preventDefault();
    }

    @HostListener('mousemove', ['$event'])
    onMouseMove(e: MouseEvent) {
        if (!this.isDragging) return;
        const rect = this.el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const walk = x - this.startX;
        if (Math.abs(walk) > this.threshold) this.dragMoved = true;
        this.el.scrollLeft = this.startScroll - walk;
        e.preventDefault();
    }

    @HostListener('mouseup')
    @HostListener('mouseleave')
    onMouseUpOrLeave() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.el.classList.remove('dragging');
    }

    // touch
    @HostListener('touchstart', ['$event'])
    onTouchStart(e: TouchEvent) {
        const touch = e.touches[0];
        if (!touch) return;
        this.isDragging = true;
        this.dragMoved = false;
        this.el.classList.add('dragging');
        const rect = this.el.getBoundingClientRect();
        this.startX = touch.clientX - rect.left;
        this.startScroll = this.el.scrollLeft;
    }

    @HostListener('touchmove', ['$event'])
    onTouchMove(e: TouchEvent) {
        if (!this.isDragging) return;
        const touch = e.touches[0];
        if (!touch) return;
        const rect = this.el.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const walk = x - this.startX;
        if (Math.abs(walk) > this.threshold) this.dragMoved = true;
        this.el.scrollLeft = this.startScroll - walk;
        e.preventDefault();
    }

    @HostListener('touchend')
    onTouchEnd() {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.el.classList.remove('dragging');
    }
}