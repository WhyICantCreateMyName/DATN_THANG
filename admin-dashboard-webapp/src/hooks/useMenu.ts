import useSWR from 'swr';
import { useState } from 'react';
import { menuService, Category, MenuItem } from '../services/menu.service';

export const useMenu = () => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [catPage, setCatPage] = useState(1);
    const [itemPage, setItemPage] = useState(1);
    const [keyword, setKeyword] = useState('');
    const [catKeyword, setCatKeyword] = useState('');

    const { data: responseCats, mutate: mutateCats } = useSWR(['categories', catPage, catKeyword], () => menuService.getCategories({ page: catPage, keyword: catKeyword }));
    
    // Server-side filtering by passing categoryId and including it in SWR key
    const { data: responseItems, mutate: mutateItems } = useSWR(
        ['menu_items', itemPage, selectedCategoryId, keyword], 
        () => menuService.getMenuItems({ page: itemPage, categoryId: selectedCategoryId, keyword })
    );

    const categories = responseCats?.data as Category[];
    const menuItems = responseItems?.data as (MenuItem & { category: Category })[];

    // Reset item page when changing category or keyword
    const handleSetCategory = (id: string | null) => {
        setSelectedCategoryId(id);
        setItemPage(1);
    };

    const handleSetKeyword = (val: string) => {
        setKeyword(val);
        setItemPage(1);
    };

    const handleSetCatKeyword = (val: string) => {
        setCatKeyword(val);
        setCatPage(1);
    };

    return {
        categories,
        metaCats: responseCats?.meta,
        menuItems,
        metaItems: responseItems?.meta,
        catPage, setCatPage,
        itemPage, setItemPage,
        selectedCategoryId, 
        setSelectedCategoryId: handleSetCategory,
        keyword, setKeyword: handleSetKeyword,
        catKeyword, setCatKeyword: handleSetCatKeyword,
        mutateCats, mutateItems
    };
};
