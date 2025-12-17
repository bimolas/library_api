export declare class UserPayload {
    id: string;
    email: string;
    name: string;
    role: string;
}
export declare class AuthPayload {
    accessToken: string;
    refreshToken: string;
    user: UserPayload;
}
