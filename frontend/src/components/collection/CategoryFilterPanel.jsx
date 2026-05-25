import CollapsibleSection from "./CollapsibleSection";
import SizeButtonGrid from "./SizeButtonGrid";
import { getCategoryFilterMeta, extractFilterOptions } from "../../config/collectionFilters";

const SubFilterGroup = ({ title, children }) => (
  <div className="mb-3 last:mb-0">
    <p className="text-[11px] font-medium text-gray-500 mb-2">{title}</p>
    {children}
  </div>
);

const Checkbox = ({ label, value, checked, onChange }) => (
  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:text-gray-900 py-0.5">
    <input
      type="checkbox"
      className="w-3.5 h-3.5 rounded border-gray-300 text-gray-800 focus:ring-gray-400"
      checked={checked}
      onChange={() => onChange(value)}
    />
    <span>{label}</span>
  </label>
);

const CategoryFilterPanel = ({
  category,
  selected,
  onSelectCategory,
  filters,
  onToggleFilter,
  products,
  open,
  onToggleOpen,
}) => {
  const meta = getCategoryFilterMeta(category);
  if (!meta) return null;

  const brandOptions = extractFilterOptions(products, category, "brand");
  const ramOptions = extractFilterOptions(products, category, "ram");
  const storageOptions = extractFilterOptions(products, category, "storage");
  const skinTypeOptions = extractFilterOptions(products, category, "skinType");

  const activeCount = Object.values(filters).reduce(
    (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
    0,
  );

  return (
    <CollapsibleSection
      title={category}
      open={open}
      onToggle={onToggleOpen}
      badge={selected ? activeCount : 0}
    >
      <label className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100 cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 rounded border-gray-300 text-gray-800"
          checked={selected}
          onChange={onSelectCategory}
        />
        <span className="text-sm font-medium text-gray-800">Include {category}</span>
      </label>

      {selected ? (
        <div className="space-y-1">
          <SubFilterGroup title="Subcategory">
            <div className="flex flex-col gap-1">
              {meta.subcategories.map((sub) => (
                <Checkbox
                  key={sub}
                  label={sub}
                  value={sub}
                  checked={filters.subCategory?.includes(sub)}
                  onChange={(v) => onToggleFilter("subCategory", v)}
                />
              ))}
            </div>
          </SubFilterGroup>

          {(category === "Clothing" || category === "Shoes") && (
            <SubFilterGroup title="Audience">
              <div className="flex flex-wrap gap-2">
                {meta.audience.map((aud) => (
                  <button
                    key={aud}
                    type="button"
                    onClick={() => onToggleFilter("audience", aud)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                      filters.audience?.includes(aud)
                        ? "bg-gray-800 text-white border-gray-800"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {aud}
                  </button>
                ))}
              </div>
            </SubFilterGroup>
          )}

          {meta.sizes?.length > 0 && (
            <SubFilterGroup title={category === "Shoes" ? "Size (EU)" : "Size"}>
              <SizeButtonGrid
                sizes={meta.sizes}
                selected={filters.sizes || []}
                onToggle={(v) => onToggleFilter("sizes", v)}
                columns={category === "Shoes" ? 4 : 5}
              />
            </SubFilterGroup>
          )}

          {meta.brand && (
            <SubFilterGroup title="Brand">
              {brandOptions.length > 0 ? (
                <div className="flex flex-col gap-1 max-h-32 overflow-y-auto pr-1">
                  {brandOptions.map((b) => (
                    <Checkbox
                      key={b}
                      label={b}
                      value={b}
                      checked={filters.brand?.includes(b)}
                      onChange={(v) => onToggleFilter("brand", v)}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400">No brands available</p>
              )}
            </SubFilterGroup>
          )}

          {meta.ram && (
            <SubFilterGroup title="RAM">
              <div className="flex flex-col gap-1">
                {ramOptions.map((r) => (
                  <Checkbox
                    key={r}
                    label={r}
                    value={r}
                    checked={filters.ram?.includes(r)}
                    onChange={(v) => onToggleFilter("ram", v)}
                  />
                ))}
              </div>
            </SubFilterGroup>
          )}

          {meta.storage && (
            <SubFilterGroup title="Storage">
              <div className="flex flex-col gap-1">
                {storageOptions.map((s) => (
                  <Checkbox
                    key={s}
                    label={s}
                    value={s}
                    checked={filters.storage?.includes(s)}
                    onChange={(v) => onToggleFilter("storage", v)}
                  />
                ))}
              </div>
            </SubFilterGroup>
          )}

          {meta.skinType && (
            <SubFilterGroup title="Skin Type">
              <div className="flex flex-col gap-1">
                {skinTypeOptions.map((s) => (
                  <Checkbox
                    key={s}
                    label={s}
                    value={s}
                    checked={filters.skinType?.includes(s)}
                    onChange={(v) => onToggleFilter("skinType", v)}
                  />
                ))}
              </div>
            </SubFilterGroup>
          )}
        </div>
      ) : (
        <p className="text-xs text-gray-400 pb-1">Select this category to show filters</p>
      )}
    </CollapsibleSection>
  );
};

export default CategoryFilterPanel;
