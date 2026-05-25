export const PRODUCT_CATEGORIES = ["Clothing", "Shoes", "Electronics", "Beauty"];

export const sortByRatingThenDate = (a, b) => {
  const ratingDiff = (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
  if (ratingDiff !== 0) return ratingDiff;
  return (Number(b.date) || 0) - (Number(a.date) || 0);
};

/** Homepage: 4 products per category (16 total), higher rated first */
export const pickHomepageLatest = (products, perCategory = 4) => {
  const picked = [];
  for (const cat of PRODUCT_CATEGORIES) {
    const catProducts = products
      .filter((p) => p.category === cat)
      .sort(sortByRatingThenDate)
      .slice(0, perCategory);
    picked.push(...catProducts);
  }
  return picked.slice(0, PRODUCT_CATEGORIES.length * perCategory);
};

/** Best sellers: 2 newest bestseller per category */
export const pickBestsellersByCategory = (products, perCategory = 2) => {
  const picked = [];
  for (const cat of PRODUCT_CATEGORIES) {
    const catBest = products
      .filter((p) => p.category === cat && p.bestseller)
      .sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0))
      .slice(0, perCategory);
    picked.push(...catBest);
  }
  return picked;
};

/** Collections: rotate 5 products per category in batch loops */
export const rotateProductsByCategory = (products, batchSize = 5) => {
  if (!products?.length) return [];

  const categoryOrder = [...PRODUCT_CATEGORIES].sort((a, b) => {
    const maxA = Math.max(
      0,
      ...products.filter((p) => p.category === a).map((p) => Number(p.date) || 0),
    );
    const maxB = Math.max(
      0,
      ...products.filter((p) => p.category === b).map((p) => Number(p.date) || 0),
    );
    return maxB - maxA;
  });

  const pools = {};
  categoryOrder.forEach((cat) => {
    pools[cat] = products
      .filter((p) => p.category === cat)
      .sort((a, b) => (Number(b.date) || 0) - (Number(a.date) || 0));
  });

  const result = [];
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const cat of categoryOrder) {
      const batch = pools[cat].splice(0, batchSize);
      if (batch.length > 0) {
        result.push(...batch);
        hasMore = true;
      }
    }
  }
  return result;
};
