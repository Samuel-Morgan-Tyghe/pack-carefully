import React from 'react';
import ShelfItem from './ShelfItem';

interface ShelfCategoryProps {
    category: string;
    items: any[];
}

const ShelfCategory: React.FC<ShelfCategoryProps> = ({ category, items }) => {
    if (items.length === 0) return null;

    return (
        <div className="mb-6">
            {/* Wooden Shelf Header */}
            <h4 className="text-xs font-serif font-bold text-wood-400 uppercase mb-2 sticky top-0 bg-wood-900/95 py-2 z-10 border-b border-wood-700 w-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold-600/50"></span> {category}
            </h4>
            <div className="grid grid-cols-2 gap-3">
                {items.map(item => (
                    <ShelfItem key={item.id} item={item} />
                ))}
            </div>
            {/* Shelf shadow */}
            <div className="h-1 bg-black/20 mt-4 rounded-full blur-sm" />
        </div>
    );
};

export default React.memo(ShelfCategory);
