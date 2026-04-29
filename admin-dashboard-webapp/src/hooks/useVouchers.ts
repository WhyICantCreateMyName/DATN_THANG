import useSWR from 'swr';
import { useState } from 'react';
import { voucherService } from '@/services/voucher.service';
import constants from '@/constants';

export const useVouchers = () => {
    const [page, setPage] = useState(1);
    const limit = constants.PAGINATION.DEFAULT_LIMIT;

    const { data, error, mutate, isLoading } = useSWR(
        ['vouchers', page, limit],
        () => voucherService.getVouchers(page, limit)
    );

    return {
        vouchers: data?.data || [],
        meta: data?.meta,
        page,
        setPage,
        isLoading,
        isError: error,
        mutateVouchers: mutate
    };
};
