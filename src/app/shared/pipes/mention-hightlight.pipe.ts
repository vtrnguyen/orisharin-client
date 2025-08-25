import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
    name: 'mentionHighlight',
    pure: true
})
export class MentionHighlightPipe implements PipeTransform {
    constructor(private sanitizer: DomSanitizer) { }

    transform(value?: string | null): SafeHtml {
        if (!value) return '';

        // escape HTML to avoid XSS from original content
        const escapeHtml = (str: string) =>
            str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');

        const escaped = escapeHtml(value);

        const mentionRegex = /(?:\$\s*@([A-Za-z0-9._-]+)\s*\$)|(?:\B@([A-Za-z0-9._-]+))/g;

        const replaced = escaped.replace(mentionRegex, (_match, g1, g2) => {
            const username = (g1 || g2 || '').trim();
            if (!username) return _match; // safety

            const display = `@${username}`;
            const href = `/${encodeURIComponent('@' + username)}`;
            return `<a class="mention" href="${href}">${display}</a>`;
        });

        return this.sanitizer.bypassSecurityTrustHtml(replaced);
    }
}