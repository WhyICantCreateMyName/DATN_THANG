import useSWR from 'swr';
import { useState } from 'react';
import { ingredientService, Ingredient } from '@/services/ingredient.service';
import constants from '@/constants';

export const useIngredients = () => {
    const [page, setPage] = useState(1);
    const limit = constants.PAGINATION.DEFAULT_LIMIT;

    const { data, error, mutate, isLoading } = useSWR(
        ['ingredients', page, limit],
        () => ingredientService.getAllIngredients(page, limit)
    );

    return {
        ingredients: data?.data || [],
        meta: data?.meta,
        page,
        setPage,
        isLoading,
        isError: error,
        mutateIngredients: mutate
    };
};

export const useStockTransactions = () => {
    const [page, setPage] = useState(1);
    const limit = constants.PAGINATION.DEFAULT_LIMIT;

    const { data, error, mutate, isLoading } = useSWR(
        ['stock-transactions', page, limit],
        () => ingredientService.getTransactionHistory(page, limit)
    );

    return {
        transactions: data?.data || [],
        meta: data?.meta,
        page,
        setPage,
        isLoading,
        isError: error,
        mutateTransactions: mutate
    };
};
