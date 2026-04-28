import api from './axios';

export interface LoginPayload {
    username: string;
    password: string;
}

export interface UserSession {
    id: string;
    username: string;
    fullName: string;
    role: string;
    isActive: boolean;
}

export const authService = {
    // Gọi API login
    login: async (payload: LoginPayload) => {
        const response = await api.post('/auth/login', payload);
        return response.data;
    },

    // Lấy thông tin user hiện tại qua Cookie session
    getMe: async (): Promise<{ user: UserSession }> => {
        const response = await api.get('/auth/me');
        return response.data;
    },

    // Gọi API logout xóa cookie
    logout: async () => {
        const response = await api.post('/auth/logout');
        return response.data;
    }
};
