import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
    selector: 'app-inbox-empty',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './inbox-empty.component.html',
    styleUrl: './inbox-empty.component.scss',
})
export class InboxEmptyComponent {
    constructor(private router: Router) { }
    startNew() { this.router.navigate(['/messages/compose']); }
}