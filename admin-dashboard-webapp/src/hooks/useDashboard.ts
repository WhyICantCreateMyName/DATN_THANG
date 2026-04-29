import useSWR from 'swr';
import api from '@/services/axios';

export const useDashboard = () => {
    const { data: statsRes, isLoading, mutate } = useSWR('dashboard_stats', async () => {
        const res = await api.get('/dashboard/stats');
        return res.data;
    });

    const data = statsRes || {
        todayRevenue: 0,
        last7DaysRevenue: [],
        popularItems: [],
        stockAlerts: [],
        stats: {
            totalTables: 0,
            occupiedTables: 0,
            fillRate: 0,
            totalStaffs: 0,
            totalOrdersToday: 0
        }
    };

    return {
        ...data,
        // Map back to old names for compatibility if needed
        totalTables: data.stats.totalTables,
        occupiedTables: data.stats.occupiedTables,
        fillRate: data.stats.fillRate,
        totalStaffs: data.stats.totalStaffs,
        isLoading,
        mutate
    };
};
