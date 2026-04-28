import useSWR from 'swr';
import { menuService } from '../services/menu.service';
import { tableService } from '../services/table.service';
import { staffService } from '../services/staff.service';

export const useDashboard = () => {
    // Kéo 50 mẩu dữ liệu làm mẫu
    const { data: menuRes } = useSWR('menu_items_dash', () => menuService.getMenuItems({ limit: 50 }));
    const { data: tablesRes } = useSWR('tables_dash', () => tableService.getTables({ limit: 50 }));
    const { data: staffsRes } = useSWR('staffs_dash', () => staffService.getStaffs({ limit: 50 }));

    const tables = tablesRes?.data;
    const staffs = staffsRes?.data;
    const menuItems = menuRes?.data;

    const totalTables = tablesRes?.meta?.total || 1; 
    const occupiedTables = tables?.filter((t: any) => t.status === 'OCCUPIED').length || 0;
    const fillRate = Math.round((occupiedTables / totalTables) * 100);

    const activeStaffs = staffs?.filter((s: any) => s.isActive).length || 0;
    const totalStaffs = staffsRes?.meta?.total || 0;

    return {
        tables,
        staffs,
        menuItems,
        totalTables,
        occupiedTables,
        fillRate,
        activeStaffs,
        totalStaffs
    };
};
