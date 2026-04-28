'use client';

import React from 'react';
import { useMenu } from '@/hooks/useMenu';
import CategorySidebar from './CategorySidebar';
import MenuItemList from './MenuItemList';

export default function MenuModule() {
    const {
        categories, metaCats,
        menuItems, metaItems,
        catPage, setCatPage,
        itemPage, setItemPage,
        selectedCategoryId, setSelectedCategoryId,
        mutateCats, mutateItems
    } = useMenu();

    return (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-120px)]">
            <CategorySidebar 
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                setSelectedCategoryId={setSelectedCategoryId}
                mutateCats={mutateCats}
                catPage={catPage}
                setCatPage={setCatPage}
                metaCats={metaCats}
            />

            <MenuItemList 
                menuItems={menuItems}
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                mutateItems={mutateItems}
                itemPage={itemPage}
                setItemPage={setItemPage}
                metaItems={metaItems}
            />
        </div>
    );
}
