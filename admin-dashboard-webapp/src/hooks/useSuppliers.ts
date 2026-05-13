import useSWR from 'swr';
import { useState } from 'react';
import { ingredientService, Supplier } from '@/services/ingredient.service';
import constants from '@/constants';

export const useSuppliers = () => {
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const limit = constants.PAGINATION.DEFAULT_LIMIT;

    const { data, error, mutate, isLoading } = useSWR(
        ['suppliers', page, limit, keyword],
        () => ingredientService.getSuppliers(page, limit, keyword)
    );

    const handleSetKeyword = (val: string) => {
        setKeyword(val);
        setPage(1);
    };

    return {
        suppliers: data?.data || [],
        meta: data?.meta,
        page,
        setPage,
        keyword,
        setKeyword: handleSetKeyword,
        isLoading,
        isError: error,
        mutateSuppliers: mutate
    };
};
