import { specificationsConfig } from "./specifications";

export const PRODUCT_CATEGORIES = ["Clothing", "Shoes", "Electronics", "Beauty"];

export const SHOE_FILTER_SIZES = ["30", "31", "32", "33", "34", "35", "36"];

export const getCategoryFilterMeta = (category) => {
  const config = specificationsConfig[category];
  if (!config) return null;

  const base = {
    subcategories: config.subcategories || [],
    audience: ["Men", "Women", "Kids"],
  };

  if (category === "Clothing") {
    return {
      ...base,
      sizes: config.availableSizes || [],
    };
  }
  if (category === "Shoes") {
    return {
      ...base,
      sizes: SHOE_FILTER_SIZES,
      brand: true,
    };
  }
  if (category === "Electronics") {
    return {
      ...base,
      ram: true,
      storage: true,
      brand: true,
    };
  }
  if (category === "Beauty") {
    return {
      ...base,
      skinType: true,
      brand: true,
    };
  }
  return base;
};

/** Extract unique spec values from products for filter options */
export const extractFilterOptions = (products, category, field) => {
  const values = new Set();
  products
    .filter((p) => p.category === category)
    .forEach((p) => {
      const specs = p.specifications || {};
      const val = specs[field];
      if (val && String(val).trim()) values.add(String(val).trim());
    });
  return [...values].sort();
};
