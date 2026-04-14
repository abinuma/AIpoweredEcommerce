import axios from "axios";
import React, { useEffect, useState } from "react";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  // -------- Pagination state
  const [currentPage, setCurrentPage] = useState(1); // current page number
  const [itemsPerPage, setItemsPerPage] = useState(10); // items per page

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setList(response.data.products);
      } else {
        toast.error(response.data.message);
      }
      console.log(response);
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
    setLoading(false);
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const response = await axios.delete(backendUrl + `/api/product/${id}`, {
        headers: {
          authorization: token,
        },
      });
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // -------- Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = list.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(list.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // -------- Helper to render page numbers with ellipsis
  const renderPageNumbers = () => {
    const pageNumbers = [];

    if (totalPages <= 5) {
      // if 5 or fewer pages, show all
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      // always show first page
      pageNumbers.push(1);

      // always show 2 and 3 if currentPage is near start
      if (currentPage <= 3) {
        pageNumbers.push(2, 3);
        pageNumbers.push("...");
      } else if (currentPage >= totalPages - 2) {
        // near the end, show last 3 pages
        pageNumbers.push("...");
        for (let i = totalPages - 2; i <= totalPages - 1; i++)
          pageNumbers.push(i);
      } else {
        // somewhere in the middle
        pageNumbers.push("...");
        pageNumbers.push(currentPage - 1, currentPage, currentPage + 1);
        pageNumbers.push("...");
      }

      // always show last page
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };
  return (
    <>
      <p className="flex flex-col gp-2 my-4">All Products List</p>
      {loading ? (
        <div className="flex flex-col items-center py-10">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-500">Loading products...</p>
        </div>
      ) : (
        <div>
          {/* ---------List table title */}
          <div className="hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm ">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b className="text-center">Action</b>
          </div>

          {/* -----Product List ------ */}

          {currentItems.map((item, index) => (
            <div
              className="
    grid 
    grid-cols-[80px_1fr_auto]      /* mobile: image + name + actions */
    md:grid-cols-[1fr_3fr_1fr_1fr_1fr]
    items-center 
    gap-3 py-3 px-2 border-b text-sm
  "
              key={item._id} // ← better to use _id instead of index
            >
              {/* Image */}
              <div className="w-16 md:w-12">
                <img
                  className="w-12"
                  src={item.image?.[0] || "/placeholder.jpg"}
                  alt={item.name}
                />
              </div>

              {/* Name + mobile price & category */}
              <div className="flex flex-col gap-1 md:block">
                <p className="font-medium">{item.name}</p>

                {/* Only visible on mobile */}
                <div className="md:hidden text-xs text-gray-600 flex flex-wrap gap-x-3">
                  <span>{item.category}</span>
                  <span className="font-medium">
                    {currency}
                    {item.price}
                  </span>
                </div>
              </div>

              {/* Category – hidden on mobile */}
              <p className="hidden md:block">{item.category}</p>

              {/* Price – hidden on mobile */}
              <p className="hidden md:block">
                {currency}
                {item.price}
              </p>

              {/* Delete button – always visible, better alignment */}
              <div className="justify-self-end md:justify-self-center">
                <button
                  onClick={() => removeProduct(item._id)}
                  className="
        text-gray-500 hover:text-red-600 
        text-xl md:text-lg font-bold
        px-2 py-1 -mr-1 md:mr-0
      "
                  title="Remove product"
                >
                  X
                </button>
              </div>
            </div>
          ))}
          {/* ---------- Pagination Controls ---------- */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
              {/* Prev button */}
              <button
                onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                className={`w-12 h-12 cursor-pointer rounded-full border flex justify-center items-center transition-colors ${
                  currentPage === 1
                    ? "border-purple-300 text-purple-300 cursor-not-allowed"
                    : "border-purple-700 text-purple-700 hover:bg-neutral-200 "
                }`}
              >
                &lt;
              </button>

              {/* Page numbers */}
              {renderPageNumbers().map((num, idx) =>
                num === "..." ? (
                  <span key={idx} className="text-purple-700  px-1">
                    ...
                  </span>
                ) : (
                  <button
                    key={idx}
                    onClick={() => paginate(num)}
                    className={`
    px-4 py-2 rounded-lg font-medium transition-all duration-200
    ${
      currentPage === num
        ? "text-purple-700 underline underline-offset-4 cursor-default"
        : "text-purple-700 hover:bg-neutral-200 hover:shadow-md"
    }
  `}
                  >
                    {num}
                  </button>
                ),
              )}

              {/* Next button */}
              <button
                onClick={() =>
                  currentPage < totalPages && paginate(currentPage + 1)
                }
                className={`w-12 h-12 cursor-pointer rounded-full border flex justify-center items-center transition-colors ${
                  currentPage === totalPages
                    ? "border-purple-300 text-purple-300 cursor-not-allowed"
                    : "border-purple-700 text-purple-700 hover:bg-neutral-200 "
                }`}
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default List;
