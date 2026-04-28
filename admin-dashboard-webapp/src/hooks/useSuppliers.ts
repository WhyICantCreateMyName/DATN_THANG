import useSWR from 'swr';
import { useState } from 'react';
import { ingredientService, Supplier } from '@/services/ingredient.service';
import constants from '@/constants';

export const useSuppliers = () => {
    const [page, setPage] = useState(1);
    const limit = constants.PAGINATION.DEFAULT_LIMIT;

    const { data, error, mutate, isLoading } = useSWR(
        ['suppliers', page, limit],
        () => ingredientService.getSuppliers(page, limit)
    );

    return {
        suppliers: data?.data || [],
        meta: data?.meta,
        page,
        setPage,
        isLoading,
        isError: error,
        mutateSuppliers: mutate
    };
};
