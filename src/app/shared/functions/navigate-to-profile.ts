import { Router } from '@angular/router';

export function navigateToProfile(router: Router, userName: string) {
    const url = '/@' + userName;
    if (router.url === url) {
        router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            router.navigate([url]);
        });
    } else {
        router.navigate([url]);
    }
}