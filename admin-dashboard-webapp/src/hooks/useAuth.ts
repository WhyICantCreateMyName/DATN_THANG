import useSWR from 'swr';
import { authService, UserSession, LoginPayload } from '../services/auth.service';

export function useAuth() {
    // SWR fetcher
    const fetcher = async () => {
        try {
            const data = await authService.getMe();
            return data.user;
        } catch (error) {
            // Nếu lỗi 401 thì ném lỗi ra để SWR biết là không có data
            throw error;
        }
    };

    // Đặt key là string 'auth_me' cho SWR để nó cache và dedup Request
    const { data: user, error, isLoading, mutate } = useSWR<UserSession>('auth_me', fetcher, {
        shouldRetryOnError: false, // Tránh retry liên tọi khi chưa đăng nhập (401)
        revalidateOnFocus: false, // Hạn chế refetch mỗi lần focus nếu không quá cần
    });

    const login = async (payload: LoginPayload) => {
        const res = await authService.login(payload);
        // Mutate dữ liệu ngay lập tức không cần fetch lại
        mutate(res.user, false);
        return res;
    };

    const logout = async () => {
        await authService.logout();
        // Xoá memory cache
        mutate(undefined, false);
    };

    return {
        user,
        isLoading,
        isError: error,
        isAuthenticated: !!user,
        login,
        logout,
        mutate
    };
}
