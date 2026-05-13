import axios from 'axios';
import constants from '@/constants';

const api = axios.create({
    baseURL: constants.url.api.production,
    // baseURL: constants.url.api.development,
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
