
export function isOwner(username: string, currentUserName: string): boolean {
    return username.toLowerCase() === currentUserName.toLowerCase();
}
