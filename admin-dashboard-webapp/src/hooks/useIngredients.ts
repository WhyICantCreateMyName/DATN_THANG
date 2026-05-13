import useSWR from 'swr';
import { useState } from 'react';
import { ingredientService, Ingredient } from '@/services/ingredient.service';
import constants from '@/constants';

export const useIngredients = () => {
    const [page, setPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const limit = constants.PAGINATION.DEFAULT_LIMIT;

    const { data, error, mutate, isLoading } = useSWR(
        ['ingredients', page, limit, keyword],
        () => ingredientService.getAllIngredients(page, limit, keyword)
    );

    const handleSetKeyword = (val: string) => {
        setKeyword(val);
        setPage(1);
    };

    return {
        ingredients: data?.data || [],
        meta: data?.meta,
        page,
        setPage,
        keyword,
        setKeyword: handleSetKeyword,
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
