export interface UserProfile {
    id: number;
    full_name: string | null;
    username: string;
    email: string;
    avatar_url: string | null;
    date_of_birth: string | null;
    english_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    account_status: 'active' | 'verified' | 'premium';
    created_at: string;
}

export interface ProfileUpdatePayload {
    full_name?: string;
    username?: string;
    date_of_birth?: string;
    english_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
}

export interface PasswordChangePayload {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
}

export interface UsernameCheckResponse {
    available: boolean;
    username: string;
}
