import { useContext, useEffect, useMemo, useState, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import { SlidersHorizontal, X } from "lucide-react";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import PriceRangeSlider from "../components/PriceRangeSlider";
import Pagination from "../components/Pagination";
import axios from "axios";
import {
  PRODUCT_CATEGORIES,
  rotateProductsByCategory,
} from "../utils/productDistribution";
import {
  getCategoryFilterMeta,
  extractFilterOptions,
} from "../config/collectionFilters";

const ITEMS_PER_PAGE = 12;

const emptyFilters = () => ({
  categories: [],
  subCategory: [],
  audience: [],
  sizes: [],
  brand: [],
  ram: [],
  storage: [],
  skinType: [],
});

const Collection = () => {
  const { products, search, showSearch, backendUrl, currency } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [filters, setFilters] = useState(emptyFilters);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 500 });
  const [sortType, setSortType] = useState("relevant");
  const [searchMeta, setSearchMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedPrice, setDebouncedPrice] = useState({ min: 0, max: 500 });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPrice(priceRange), 350);
    return () => clearTimeout(timer);
  }, [priceRange]);

  const activeCategory =
    filters.categories.length === 1 ? filters.categories[0] : null;
  const categoryMeta = activeCategory ? getCategoryFilterMeta(activeCategory) : null;

  const brandOptions = useMemo(
    () => (activeCategory ? extractFilterOptions(products, activeCategory, "brand") : []),
    [products, activeCategory],
  );
  const ramOptions = useMemo(
    () => (activeCategory === "Electronics" ? extractFilterOptions(products, "Electronics", "ram") : []),
    [products, activeCategory],
  );
  const storageOptions = useMemo(
    () =>
      activeCategory === "Electronics"
        ? extractFilterOptions(products, "Electronics", "storage")
        : [],
    [products, activeCategory],
  );
  const skinTypeOptions = useMemo(
    () => (activeCategory === "Beauty" ? extractFilterOptions(products, "Beauty", "skinType") : []),
    [products, activeCategory],
  );

  useEffect(() => {
    const fetchBounds = async () => {
      try {
        const res = await axios.get(backendUrl + "/api/product/price-bounds");
        if (res.data.success) {
          setPriceBounds({ min: res.data.minPrice, max: res.data.maxPrice });
          setPriceRange({ min: res.data.minPrice, max: res.data.maxPrice });
        }
      } catch (e) {
        console.log(e);
      }
    };
    fetchBounds();
  }, [backendUrl]);

  const toggleFilter = (key, value) => {
    setFilters((prev) => {
      const list = prev[key];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return { ...prev, [key]: next };
    });
    setCurrentPage(1);
  };

  const toggleCategory = (cat) => {
    setFilters((prev) => {
      const nextCats = prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat];
      return {
        ...emptyFilters(),
        categories: nextCats,
        subCategory: [],
        audience: [],
        sizes: [],
        brand: [],
        ram: [],
        storage: [],
        skinType: [],
      };
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters(emptyFilters());
    setPriceRange({ min: priceBounds.min, max: priceBounds.max });
    setSortType("relevant");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.subCategory.length > 0 ||
    filters.audience.length > 0 ||
    filters.sizes.length > 0 ||
    filters.brand.length > 0 ||
    filters.ram.length > 0 ||
    filters.storage.length > 0 ||
    filters.skinType.length > 0 ||
    debouncedPrice.min > priceBounds.min ||
    debouncedPrice.max < priceBounds.max;

  const buildFilterQuery = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.categories.length) params.set("category", filters.categories.join(","));
    if (filters.subCategory.length) params.set("subCategory", filters.subCategory.join(","));
    if (filters.audience.length) params.set("audience", filters.audience.join(","));
    if (filters.sizes.length) params.set("sizes", filters.sizes.join(","));
    if (filters.brand.length) params.set("brand", filters.brand.join(","));
    if (filters.ram.length) params.set("ram", filters.ram.join(","));
    if (filters.storage.length) params.set("storage", filters.storage.join(","));
    if (filters.skinType.length) params.set("skinType", filters.skinType.join(","));
    if (debouncedPrice.min > priceBounds.min) params.set("priceMin", String(debouncedPrice.min));
    if (debouncedPrice.max < priceBounds.max) params.set("priceMax", String(debouncedPrice.max));
    if (sortType === "low-high" || sortType === "high-low") params.set("sort", sortType);
    return params.toString();
  }, [filters, debouncedPrice, priceBounds, sortType]);

  const applyFilter = useCallback(async () => {
    setLoading(true);
    let productsCopy = [];

    if (showSearch && search) {
      try {
        const response = await axios.get(
          backendUrl + `/api/search/search?q=${encodeURIComponent(search)}&limit=100`,
        );
        if (response.data.success) {
          productsCopy = response.data.products;
          setSearchMeta({
            method: response.data.searchMethod,
            interpretedQuery: response.data.interpretedQuery,
          });
        }
      } catch (error) {
        console.log(error);
        productsCopy = products.filter(
          (item) =>
            item.name?.toLowerCase().includes(search.toLowerCase()) ||
            item.description?.toLowerCase().includes(search.toLowerCase()) ||
            item.category?.toLowerCase().includes(search.toLowerCase()) ||
            String(item.price).includes(search),
        );
        setSearchMeta({ method: "local", interpretedQuery: null });
      }

      if (filters.categories.length > 0) {
        productsCopy = productsCopy.filter((p) => filters.categories.includes(p.category));
      }
      if (filters.subCategory.length > 0) {
        productsCopy = productsCopy.filter((p) => filters.subCategory.includes(p.subCategory));
      }
      if (filters.audience.length > 0) {
        productsCopy = productsCopy.filter((p) =>
          filters.audience.includes(p.specifications?.Audience),
        );
      }
      if (filters.brand.length > 0) {
        productsCopy = productsCopy.filter((p) =>
          filters.brand.includes(p.specifications?.brand),
        );
      }
      if (filters.ram.length > 0) {
        productsCopy = productsCopy.filter((p) =>
          filters.ram.includes(p.specifications?.ram),
        );
      }
      if (filters.storage.length > 0) {
        productsCopy = productsCopy.filter((p) =>
          filters.storage.includes(p.specifications?.storage),
        );
      }
      if (filters.skinType.length > 0) {
        productsCopy = productsCopy.filter((p) =>
          filters.skinType.includes(p.specifications?.skinType),
        );
      }
      if (filters.sizes.length > 0) {
        productsCopy = productsCopy.filter((p) => {
          const sizes = Array.isArray(p.sizes) ? p.sizes : [];
          return sizes.some((s) => {
            const label = typeof s === "string" ? s : s?.size;
            return filters.sizes.includes(label);
          });
        });
      }
      productsCopy = productsCopy.filter(
        (p) => p.price >= debouncedPrice.min && p.price <= debouncedPrice.max,
      );
    } else {
      setSearchMeta(null);
      try {
        const qs = buildFilterQuery();
        const url = qs
          ? `${backendUrl}/api/product/filter?${qs}`
          : `${backendUrl}/api/product/list`;
        const response = await axios.get(url);
        if (response.data.success) {
          productsCopy = response.data.products;
        }
      } catch (error) {
        console.log(error);
        productsCopy = products.slice();
      }
    }

    if (sortType === "relevant" && !(showSearch && search)) {
      productsCopy = rotateProductsByCategory(productsCopy, 5);
    } else if (sortType === "low-high") {
      productsCopy.sort((a, b) => a.price - b.price);
    } else if (sortType === "high-low") {
      productsCopy.sort((a, b) => b.price - a.price);
    }

    setFilterProducts(productsCopy);
    setLoading(false);
  }, [
    products,
    search,
    showSearch,
    backendUrl,
    filters,
    debouncedPrice,
    sortType,
    buildFilterQuery,
  ]);

  useEffect(() => {
    applyFilter();
  }, [applyFilter]);

  const totalPages = Math.max(1, Math.ceil(filterProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = filterProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  const FilterGroup = ({ title, children }) => (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</p>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );

  const Checkbox = ({ label, value, checked, onChange }) => (
    <label className="flex items-center gap-2.5 text-sm text-gray-700 cursor-pointer group">
      <input
        type="checkbox"
        className="w-4 h-4 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span className="group-hover:text-gray-900">{label}</span>
    </label>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 pt-10 border-t px-4 sm:px-6">
      {/* Filters sidebar */}
      <aside className="w-full lg:w-[280px] shrink-0">
        <button
          type="button"
          onClick={() => setShowFilter(!showFilter)}
          className="lg:hidden w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white"
        >
          <SlidersHorizontal size={18} />
          {showFilter ? "Hide Filters" : "Show Filters"}
        </button>

        <div
          className={`mt-4 lg:mt-0 bg-white border border-gray-200 rounded-lg p-5 ${
            showFilter ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <X size={14} /> Clear all
              </button>
            )}
          </div>

          <FilterGroup title="Category">
            {PRODUCT_CATEGORIES.map((cat) => (
              <Checkbox
                key={cat}
                label={cat}
                value={cat}
                checked={filters.categories.includes(cat)}
                onChange={toggleCategory}
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Price">
            <PriceRangeSlider
              min={priceBounds.min}
              max={priceBounds.max}
              value={priceRange}
              onChange={(v) => {
                setPriceRange(v);
                setCurrentPage(1);
              }}
              currency={currency}
            />
          </FilterGroup>

          {activeCategory && categoryMeta && (
            <>
              <FilterGroup title="Subcategory">
                {categoryMeta.subcategories.map((sub) => (
                  <Checkbox
                    key={sub}
                    label={sub}
                    value={sub}
                    checked={filters.subCategory.includes(sub)}
                    onChange={(v) => toggleFilter("subCategory", v)}
                  />
                ))}
              </FilterGroup>

              {(activeCategory === "Clothing" || activeCategory === "Shoes") && (
                <FilterGroup title="Audience">
                  {categoryMeta.audience.map((aud) => (
                    <Checkbox
                      key={aud}
                      label={aud}
                      value={aud}
                      checked={filters.audience.includes(aud)}
                      onChange={(v) => toggleFilter("audience", v)}
                    />
                  ))}
                </FilterGroup>
              )}

              {categoryMeta.sizes?.length > 0 && (
                <FilterGroup title="Size">
                  {categoryMeta.sizes.map((sz) => (
                    <Checkbox
                      key={sz}
                      label={sz}
                      value={sz}
                      checked={filters.sizes.includes(sz)}
                      onChange={(v) => toggleFilter("sizes", v)}
                    />
                  ))}
                </FilterGroup>
              )}

              {categoryMeta.brand && (
                <FilterGroup title="Brand">
                  {brandOptions.length > 0 ? (
                    brandOptions.map((b) => (
                      <Checkbox
                        key={b}
                        label={b}
                        value={b}
                        checked={filters.brand.includes(b)}
                        onChange={(v) => toggleFilter("brand", v)}
                      />
                    ))
                  ) : (
                    <p className="text-xs text-gray-400">No brands available</p>
                  )}
                </FilterGroup>
              )}

              {categoryMeta.ram && (
                <FilterGroup title="RAM">
                  {ramOptions.map((r) => (
                    <Checkbox
                      key={r}
                      label={r}
                      value={r}
                      checked={filters.ram.includes(r)}
                      onChange={(v) => toggleFilter("ram", v)}
                    />
                  ))}
                </FilterGroup>
              )}

              {categoryMeta.storage && (
                <FilterGroup title="Storage">
                  {storageOptions.map((s) => (
                    <Checkbox
                      key={s}
                      label={s}
                      value={s}
                      checked={filters.storage.includes(s)}
                      onChange={(v) => toggleFilter("storage", v)}
                    />
                  ))}
                </FilterGroup>
              )}

              {categoryMeta.skinType && (
                <FilterGroup title="Skin Type">
                  {skinTypeOptions.map((s) => (
                    <Checkbox
                      key={s}
                      label={s}
                      value={s}
                      checked={filters.skinType.includes(s)}
                      onChange={(v) => toggleFilter("skinType", v)}
                    />
                  ))}
                </FilterGroup>
              )}
            </>
          )}
        </div>
      </aside>

      {/* Products */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          {showSearch && search ? (
            <div>
              <Title text1={"SEARCH"} text2={"RESULTS"} />
              {searchMeta?.method && (
                <p className="text-xs text-gray-500 mt-1">Search mode: {searchMeta.method}</p>
              )}
            </div>
          ) : (
            <Title text1={"ALL"} text2={"COLLECTIONS"} />
          )}

          <select
            value={sortType}
            onChange={(e) => {
              setSortType(e.target.value);
              setCurrentPage(1);
            }}
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 w-full sm:w-auto max-w-[220px] bg-white text-gray-700 outline-none focus:border-gray-400"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        <p className="text-xs text-gray-400 mb-4">
          {filterProducts.length} product{filterProducts.length !== 1 ? "s" : ""}
          {loading ? " · Updating..." : ""}
        </p>

        {loading && filterProducts.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
          </div>
        ) : filterProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
              {paginatedProducts.map((item) => (
                <ProductItem
                  key={item._id}
                  name={item.name}
                  id={item._id}
                  price={item.price}
                  image={item.image}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              className="mt-8"
            />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/80 text-center">
            <p className="text-base font-medium text-gray-800 mb-2">
              No products match the selected filters.
            </p>
            <p className="text-sm text-gray-500 mb-6 max-w-md">
              Try adjusting your filters.
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-sm font-medium text-white bg-gray-800 px-5 py-2.5 rounded-lg hover:bg-gray-900 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Collection;
