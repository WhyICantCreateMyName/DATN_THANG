import useSWR from 'swr';
import { useState } from 'react';
import { staffService, User } from '../services/staff.service';
import constants from '@/constants';

export const useStaff = () => {
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const limit = constants.PAGINATION.DEFAULT_LIMIT;
    
    const { data: response, mutate: mutateStaffs, isLoading } = useSWR(
        ['staffs', page, limit, keyword], 
        () => staffService.getStaffs({ page, limit, keyword })
    );

    const handleSetKeyword = (val: string) => {
        setKeyword(val);
        setPage(1);
    };
    
    return {
        staffs: response?.data as User[],
        meta: response?.meta,
        page, 
        setPage,
        keyword,
        setKeyword: handleSetKeyword,
        mutateStaffs,
        isLoading
    };
};
