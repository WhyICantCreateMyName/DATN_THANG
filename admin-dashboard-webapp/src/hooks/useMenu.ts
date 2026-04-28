import useSWR from 'swr';
import { useState } from 'react';
import { menuService, Category, MenuItem } from '../services/menu.service';

export const useMenu = () => {
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
    const [catPage, setCatPage] = useState(1);
    const [itemPage, setItemPage] = useState(1);

    const { data: responseCats, mutate: mutateCats } = useSWR(['categories', catPage], () => menuService.getCategories({ page: catPage }));
    const { data: responseItems, mutate: mutateItems } = useSWR(['menu_items', itemPage], () => menuService.getMenuItems({ page: itemPage }));

    const categories = responseCats?.data as Category[];
    const menuItems = responseItems?.data as (MenuItem & { category: Category })[];

    const filteredItems = selectedCategoryId 
        ? menuItems?.filter((item: any) => item.categoryId === selectedCategoryId) 
        : menuItems;

    return {
        categories,
        metaCats: responseCats?.meta,
        menuItems: filteredItems,
        metaItems: responseItems?.meta,
        catPage, setCatPage,
        itemPage, setItemPage,
        selectedCategoryId, setSelectedCategoryId,
        mutateCats, mutateItems
    };
};
