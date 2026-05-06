import useSWR from 'swr';
import { useState } from 'react';
import { menuService, Category, MenuItem } from '../services/menu.service';

export const useMenu = () => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [catPage, setCatPage] = useState(1);
    const [itemPage, setItemPage] = useState(1);

    const { data: responseCats, mutate: mutateCats } = useSWR(['categories', catPage], () => menuService.getCategories({ page: catPage }));
    
    // Server-side filtering by passing categoryId and including it in SWR key
    const { data: responseItems, mutate: mutateItems } = useSWR(
        ['menu_items', itemPage, selectedCategoryId], 
        () => menuService.getMenuItems({ page: itemPage, categoryId: selectedCategoryId })
    );

    const categories = responseCats?.data as Category[];
    const menuItems = responseItems?.data as (MenuItem & { category: Category })[];

    // Reset item page when changing category
    const handleSetCategory = (id: string | null) => {
        setSelectedCategoryId(id);
        setItemPage(1);
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
        mutateCats, mutateItems
    };
};
