
export interface UserProfileDto {
    id: string;
    accountId: string;
    username: string;
    fullName: string;
    displayName: string;
    websiteLinks: string[];
    isVerified: boolean;
    followersCount: number;
    followingCount: number;
    createdAt: string;
    updatedAt: string;
    avatarUrl?: string;
    bio?: string;
}

export interface FollowingUserDto {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
}

export interface UserProfileResponseDto {
    user: UserProfileDto;
    followings: FollowingUserDto[];
}
