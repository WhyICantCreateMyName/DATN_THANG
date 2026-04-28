import { Metadata } from 'next';
import IngredientModule from '@/components/IngredientPage/IngredientModule';

export const metadata: Metadata = {
    title: 'Quản lý nguyên liệu | Admin Dashboard',
    description: 'Quản lý kho nguyên vật liệu và chuỗi cung ứng nhà hàng',
};

export default function IngredientsPage() {
    return <IngredientModule />;
}
