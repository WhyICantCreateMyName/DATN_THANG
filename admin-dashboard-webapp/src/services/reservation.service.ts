import api from './axios';

export interface Reservation {
    id: string;
    customerName: string;
    customerPhone: string;
    guests: number;
    reservationTime: string;
    note: string | null;
    status: 'PENDING' | 'CONFIRMED' | 'ARRIVED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';
    tableId: string | null;
    table?: any;
    createdAt: string;
}

export const reservationService = {
    getReservations: async () => {
        const response = await api.get('/reservations');
        return response.data;
    },
    updateStatus: async (id: string, status: string, tableId?: string, extraData?: any) => {
        const response = await api.patch(`/reservations/${id}`, { status, tableId, ...extraData });
        return response.data;
    }
};
