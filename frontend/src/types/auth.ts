export interface User {
    id: number;
    full_name?: string;
    username: string;
    email: string;
    avatar_url?: string;
    role: string;
    date_of_birth?: string;
    english_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    account_status?: 'active' | 'verified' | 'premium';
    created_at: string;
    updated_at: string;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    verifyEmail: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    logoutAll: () => Promise<void>;
    fetchUser: () => Promise<void>;
}
