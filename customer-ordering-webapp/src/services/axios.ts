import axios from 'axios';
import constants from '@/constants';

const api = axios.create({
    baseURL: process.env.NODE_ENV === 'development' ? constants.url.api.development : constants.url.api.production,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Xử lý khi hết hạn phiên làm việc (nếu cần)
        }
        return Promise.reject(error);
    }
);

export default api;
