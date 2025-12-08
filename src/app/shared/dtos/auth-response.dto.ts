
export interface AuthResponse {
    success: boolean;
    accessToken: string;
    user: {
        id: string;
        username: string;
        fullName: string;
        email: string;
        role: string;
    };
}
