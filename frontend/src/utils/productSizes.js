/** Normalize product size entries (string or { size, stock }) to display labels */
export const getSizeLabel = (entry) => {
  if (entry == null) return "";
  if (typeof entry === "string") return entry;
  if (typeof entry === "object" && entry.size != null) return String(entry.size);
  return String(entry);
};

export const normalizeProductSizes = (sizes) => {
  if (!sizes) return [];
  let arr = sizes;
  if (typeof sizes === "string") {
    try {
      arr = JSON.parse(sizes);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr.map(getSizeLabel).filter(Boolean);
};

export const getTotalSizeStock = (sizes) => {
  if (!Array.isArray(sizes) || sizes.length === 0) return null;
  if (typeof sizes[0] === "string") return null;
  return sizes.reduce((sum, s) => sum + (Number(s?.stock) || 0), 0);
};
