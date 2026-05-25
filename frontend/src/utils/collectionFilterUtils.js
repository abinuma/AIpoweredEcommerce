export const initialCategoryFilters = () => ({
  Clothing: { subCategory: [], audience: [], sizes: [] },
  Shoes: { subCategory: [], audience: [], sizes: [], brand: [] },
  Electronics: { subCategory: [], ram: [], storage: [], brand: [] },
  Beauty: { subCategory: [], skinType: [], brand: [] },
});

const sizeLabels = (sizes) => {
  if (!Array.isArray(sizes)) return [];
  return sizes.map((s) => (typeof s === "string" ? s : s?.size)).filter(Boolean);
};

export const productMatchesCategoryFilters = (product, selectedCategories, categoryFilters) => {
  if (selectedCategories.length > 0 && !selectedCategories.includes(product.category)) {
    return false;
  }

  const f = categoryFilters[product.category];
  if (!f) return true;

  if (f.subCategory?.length > 0 && !f.subCategory.includes(product.subCategory)) {
    return false;
  }
  if (f.audience?.length > 0 && !f.audience.includes(product.specifications?.Audience)) {
    return false;
  }
  if (f.brand?.length > 0 && !f.brand.includes(product.specifications?.brand)) {
    return false;
  }
  if (f.ram?.length > 0 && !f.ram.includes(product.specifications?.ram)) {
    return false;
  }
  if (f.storage?.length > 0 && !f.storage.includes(product.specifications?.storage)) {
    return false;
  }
  if (f.skinType?.length > 0 && !f.skinType.includes(product.specifications?.skinType)) {
    return false;
  }
  if (f.sizes?.length > 0) {
    const labels = sizeLabels(product.sizes);
    if (!labels.some((label) => f.sizes.includes(label))) return false;
  }

  return true;
};

export const flattenCategoryFilters = (selectedCategories, categoryFilters) => {
  const flat = {
    subCategory: [],
    audience: [],
    sizes: [],
    brand: [],
    ram: [],
    storage: [],
    skinType: [],
  };

  for (const cat of selectedCategories) {
    const f = categoryFilters[cat] || {};
    for (const key of Object.keys(flat)) {
      if (f[key]?.length) flat[key].push(...f[key]);
    }
  }

  return flat;
};

export const countActiveCategoryFilters = (selectedCategories, categoryFilters) => {
  let count = 0;
  for (const cat of selectedCategories) {
    const f = categoryFilters[cat] || {};
    for (const arr of Object.values(f)) {
      if (Array.isArray(arr)) count += arr.length;
    }
  }
  return count;
};
