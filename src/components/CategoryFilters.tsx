import React from 'react';

interface CategoryFiltersProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const CategoryFilters = ({ categories, selectedCategory, onCategorySelect }: CategoryFiltersProps) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <button
        className={`px-3 py-1 rounded-full text-sm ${
          selectedCategory === null
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 hover:bg-gray-300'
        }`}
        onClick={() => onCategorySelect(null)}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          className={`px-3 py-1 rounded-full text-sm ${
            selectedCategory === category
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
          onClick={() => onCategorySelect(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilters; 