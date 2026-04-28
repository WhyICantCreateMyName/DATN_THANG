import useSWR from 'swr';
import { useState } from 'react';
import { staffService, User } from '../services/staff.service';

export const useStaff = () => {
    const [page, setPage] = useState(1);
    
    const { data: response, mutate: mutateStaffs, isLoading } = useSWR(['staffs', page], () => staffService.getStaffs({ page }));
    
    return {
        staffs: response?.data as User[],
        meta: response?.meta,
        page, setPage,
        mutateStaffs,
        isLoading
    };
};
