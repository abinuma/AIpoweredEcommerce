const SizeButtonGrid = ({ sizes, selected, onToggle, columns = 4 }) => {
  const gridClass =
    columns >= 5
      ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5"
      : "grid-cols-3 sm:grid-cols-4";

  return (
  <div className={`grid gap-2 ${gridClass}`}>
    {sizes.map((sz) => {
      const active = selected.includes(sz);
      return (
        <button
          key={sz}
          type="button"
          onClick={() => onToggle(sz)}
          className={`min-h-[36px] px-1 py-2 text-xs font-medium rounded-md border transition-all duration-150 ${
            active
              ? "bg-gray-800 text-white border-gray-800 shadow-sm"
              : "bg-white text-gray-700 border-gray-200 hover:border-gray-400 hover:bg-gray-50"
          }`}
        >
          {sz}
        </button>
      );
    })}
  </div>
  );
};

export default SizeButtonGrid;
