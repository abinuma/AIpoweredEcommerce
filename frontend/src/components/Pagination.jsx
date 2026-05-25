import { ChevronLeft, ChevronRight } from "lucide-react";

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}) => {
  if (totalPages <= 1) return null;

  const pages = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (currentPage <= 3) {
      pages.push(2, 3, "...");
    } else if (currentPage >= totalPages - 2) {
      pages.push("...", totalPages - 2, totalPages - 1);
    } else {
      pages.push("...", currentPage - 1, currentPage, currentPage + 1, "...");
    }
    pages.push(totalPages);
  }

  return (
    <div className={`flex justify-center items-center gap-2 flex-wrap ${className}`}>
      <button
        type="button"
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
          currentPage === 1
            ? "border-gray-200 text-gray-300 cursor-not-allowed"
            : "border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
        }`}
        aria-label="Previous page"
      >
        <ChevronLeft size={20} />
      </button>

      {pages.map((num, idx) =>
        num === "..." ? (
          <span key={`ellipsis-${idx}`} className="text-gray-400 px-1">
            …
          </span>
        ) : (
          <button
            key={num}
            type="button"
            onClick={() => onPageChange(num)}
            className={`min-w-[36px] h-9 px-3 rounded text-sm font-medium transition-colors ${
              currentPage === num
                ? "bg-gray-800 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {num}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`w-9 h-9 rounded-full border flex items-center justify-center transition-colors ${
          currentPage === totalPages
            ? "border-gray-200 text-gray-300 cursor-not-allowed"
            : "border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
        }`}
        aria-label="Next page"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
};

export default Pagination;
