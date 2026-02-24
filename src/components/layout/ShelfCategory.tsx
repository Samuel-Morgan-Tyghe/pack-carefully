import type React from "react"
import ShelfItem from "./ShelfItem"

import type { Item } from "../../types"

interface ShelfCategoryProps {
  items: Item[]
}

export const ShelfCategory: React.FC<ShelfCategoryProps> = ({ items }) => {
  if (items.length === 0) return null

  return (
    <div className="pb-4">
      <div className="grid grid-cols-3 gap-2">
        {items.map((item, index) => (
          /* FIX: Use index in key to handle duplicate item IDs in draft pool */
          <ShelfItem key={`${item.id}-${index}`} item={item} />
        ))}
      </div>
    </div>
  )
}
