import { User } from "./user.interface";

export interface Post {
    _id: string;
    authorId: User | string;
    content: string;
    mediaUrls: string[];
    privacy: 'public' | 'followers' | 'private';
    originalPostId?: string;
    sharedFromPostId?: string;
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    sharesCount: number;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}
