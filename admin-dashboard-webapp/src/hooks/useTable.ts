import useSWR from 'swr';
import { useState } from 'react';
import { tableService, Table } from '../services/table.service';

export const useTable = () => {
    const [page, setPage] = useState(1);
    
    const { data: response, mutate: mutateTables, isLoading } = useSWR(
        ['tables', page], 
        () => tableService.getTables({ page }),
        { refreshInterval: 30000 }
    );
    
    const checkoutTable = async (id: string) => {
        await tableService.checkoutTable(id);
        mutateTables(); // Refresh lại danh sách bàn
    };

    return {
        tables: response?.data as Table[],
        meta: response?.meta,
        page, setPage,
        mutateTables,
        isLoading,
        checkoutTable
    };
};
