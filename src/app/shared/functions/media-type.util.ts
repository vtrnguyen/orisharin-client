
export function isImage(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.startsWith('data:image');
}

export function isVideo(url: string): boolean {
    return /\.(mp4|webm|ogg|mov)$/i.test(url) || url.startsWith('data:video');
}