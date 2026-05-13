import useSWR from 'swr';
import { useState } from 'react';
import { voucherService } from '@/services/voucher.service';
import constants from '@/constants';

export const useVouchers = () => {
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const limit = constants.PAGINATION.DEFAULT_LIMIT;

    const { data, error, mutate, isLoading } = useSWR(
        ['vouchers', page, limit, keyword],
        () => voucherService.getVouchers(page, limit, keyword)
    );

    const handleSetKeyword = (val: string) => {
        setKeyword(val);
        setPage(1);
    };

    return {
        vouchers: data?.data || [],
        meta: data?.meta,
        page,
        setPage,
        keyword,
        setKeyword: handleSetKeyword,
        isLoading,
        isError: error,
        mutateVouchers: mutate
    };
};
