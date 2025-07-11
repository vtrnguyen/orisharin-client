
export interface User {
    _id: string;
    username: string;
    fullName: string;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    websiteLinks?: string[];
    isVerified?: boolean;
    followersCount?: number;
    followingCount?: number;
}
