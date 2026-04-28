import useSWR from 'swr';
import { useState } from 'react';
import { staffService, User } from '../services/staff.service';
import constants from '@/constants';

export const useStaff = () => {
    const [page, setPage] = useState(1);
    const limit = constants.PAGINATION.DEFAULT_LIMIT;
    
    const { data: response, mutate: mutateStaffs, isLoading } = useSWR(
        ['staffs', page, limit], 
        () => staffService.getStaffs({ page, limit })
    );
    
    return {
        staffs: response?.data as User[],
        meta: response?.meta,
        page, 
        setPage,
        mutateStaffs,
        isLoading
    };
};
