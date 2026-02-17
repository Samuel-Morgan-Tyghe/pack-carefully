import React from 'react';
import ShelfItem from './ShelfItem';

import type { Item } from '../../types';

interface ShelfCategoryProps {
    category: string;
    items: Item[];
}

const ShelfCategory: React.FC<ShelfCategoryProps> = ({ items }) => {
    if (items.length === 0) return null;

    return (
        <div className="pb-4">
            <div className="grid grid-cols-3 gap-2">
                {items.map(item => (
                    <ShelfItem key={item.id} item={item} />
                ))}
            </div>
        </div>
    );
};

export default React.memo(ShelfCategory);
