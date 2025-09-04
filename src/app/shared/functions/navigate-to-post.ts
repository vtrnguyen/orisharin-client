import { Router } from '@angular/router';

export function navigateToPost(router: Router, userName: string, postId: string) {
    const url = `/@${userName}/post/${postId}`;
    if (router.url === url) {
        router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            router.navigate([url]);
        });
    } else {
        router.navigate([url]);
    }
}