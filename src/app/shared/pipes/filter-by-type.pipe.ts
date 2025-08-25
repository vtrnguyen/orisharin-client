import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filterByType',
    standalone: true
})
export class FilterByTypePipe implements PipeTransform {
    transform(reactions: any[] | null | undefined, type: string | null | undefined): any[] {
        if (!Array.isArray(reactions) || !type) return [];
        return reactions.filter(r => {
            const t = r?.type ?? r?.reaction ?? null;
            return String(t) === String(type);
        });
    }
}