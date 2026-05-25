import { useContext, useEffect, useState, useCallback } from "react";
import { ShopContext } from "../context/ShopContext";
import { SlidersHorizontal, X } from "lucide-react";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";
import PriceRangeSlider from "../components/PriceRangeSlider";
import Pagination from "../components/Pagination";
import CollapsibleSection from "../components/collection/CollapsibleSection";
import CategoryFilterPanel from "../components/collection/CategoryFilterPanel";
import axios from "axios";
import {
  PRODUCT_CATEGORIES,
  rotateProductsByCategory,
} from "../utils/productDistribution";
import {
  initialCategoryFilters,
  productMatchesCategoryFilters,
  flattenCategoryFilters,
  countActiveCategoryFilters,
} from "../utils/collectionFilterUtils";

const ITEMS_PER_PAGE = 12;

const Collection = () => {
  const { products, search, showSearch, backendUrl, currency } = useContext(ShopContext);
  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoryFilters, setCategoryFilters] = useState(initialCategoryFilters);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 500 });
  const [priceBounds, setPriceBounds] = useState({ min: 0, max: 500 });
  const [sortType, setSortType] = useState("relevant");
  const [searchMeta, setSearchMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [expanded, setExpanded] = useState({
    price: true,
    ...Object.fromEntries(PRODUCT_CATEGORIES.map((c) => [c, false])),
  });

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

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) => {
      const next = prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat];
      if (!prev.includes(cat)) {
        setExpanded((e) => ({ ...e, [cat]: true }));
      }
      return next;
    });
    setCurrentPage(1);
  };

  const toggleCategoryFilter = (cat, key, value) => {
    setCategoryFilters((prev) => {
      const list = prev[cat][key] || [];
      const next = list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value];
      return {
        ...prev,
        [cat]: { ...prev[cat], [key]: next },
      };
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setCategoryFilters(initialCategoryFilters());
    setPriceRange({ min: priceBounds.min, max: priceBounds.max });
    setSortType("relevant");
    setCurrentPage(1);
  };

  const specFilterActive = countActiveCategoryFilters(selectedCategories, categoryFilters) > 0;

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    specFilterActive ||
    priceRange.min > priceBounds.min ||
    priceRange.max < priceBounds.max;

  const applyFilter = useCallback(async () => {
    setLoading(true);
    let productsCopy = [];
    const usePerCategoryMatch = selectedCategories.length > 1;

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
    } else {
      setSearchMeta(null);
      try {
        const params = new URLSearchParams();
        if (selectedCategories.length) {
          params.set("category", selectedCategories.join(","));
        }
        if (priceRange.min > priceBounds.min) params.set("priceMin", String(priceRange.min));
        if (priceRange.max < priceBounds.max) params.set("priceMax", String(priceRange.max));
        if (!usePerCategoryMatch) {
          const flat = flattenCategoryFilters(selectedCategories, categoryFilters);
          if (flat.subCategory.length) params.set("subCategory", [...new Set(flat.subCategory)].join(","));
          if (flat.audience.length) params.set("audience", [...new Set(flat.audience)].join(","));
          if (flat.sizes.length) params.set("sizes", [...new Set(flat.sizes)].join(","));
          if (flat.brand.length) params.set("brand", [...new Set(flat.brand)].join(","));
          if (flat.ram.length) params.set("ram", [...new Set(flat.ram)].join(","));
          if (flat.storage.length) params.set("storage", [...new Set(flat.storage)].join(","));
          if (flat.skinType.length) params.set("skinType", [...new Set(flat.skinType)].join(","));
        }
        if (sortType === "low-high" || sortType === "high-low") params.set("sort", sortType);

        const qs = params.toString();
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

    productsCopy = productsCopy.filter(
      (p) => p.price >= priceRange.min && p.price <= priceRange.max,
    );

    if (selectedCategories.length > 0 || specFilterActive) {
      productsCopy = productsCopy.filter((p) =>
        productMatchesCategoryFilters(p, selectedCategories, categoryFilters),
      );
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
    selectedCategories,
    categoryFilters,
    priceRange,
    priceBounds,
    sortType,
    specFilterActive,
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 pt-10 border-t px-4 sm:px-6">
      <aside className="w-full lg:w-[300px] shrink-0">
        <button
          type="button"
          onClick={() => setShowFilter(!showFilter)}
          className="lg:hidden w-full flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white shadow-sm"
        >
          <SlidersHorizontal size={18} />
          {showFilter ? "Hide Filters" : "Show Filters"}
        </button>

        <div
          className={`mt-4 lg:mt-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${
            showFilter ? "block" : "hidden lg:block"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
            <h3 className="text-sm font-semibold text-gray-800">Filters</h3>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors"
              >
                <X size={14} /> Clear all
              </button>
            )}
          </div>

          <div className="px-5 max-h-[calc(100vh-8rem)] overflow-y-auto">
            <CollapsibleSection
              title="Price"
              open={expanded.price}
              onToggle={() => setExpanded((e) => ({ ...e, price: !e.price }))}
              badge={
                priceRange.min > priceBounds.min || priceRange.max < priceBounds.max ? 1 : 0
              }
            >
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
            </CollapsibleSection>

            {PRODUCT_CATEGORIES.map((cat) => (
              <CategoryFilterPanel
                key={cat}
                category={cat}
                selected={selectedCategories.includes(cat)}
                onSelectCategory={() => toggleCategory(cat)}
                filters={categoryFilters[cat]}
                onToggleFilter={(key, value) => toggleCategoryFilter(cat, key, value)}
                products={products}
                open={expanded[cat]}
                onToggleOpen={() => setExpanded((e) => ({ ...e, [cat]: !e[cat] }))}
              />
            ))}
          </div>
        </div>
      </aside>

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
            className="border border-gray-200 rounded-lg text-sm px-3 py-2 w-full sm:w-auto max-w-[220px] bg-white text-gray-700 outline-none focus:border-gray-400 shadow-sm"
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
            <p className="text-sm text-gray-500 mb-6 max-w-md">Try adjusting your filters.</p>
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
