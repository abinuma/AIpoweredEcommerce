import axios from "axios";
import React, { useEffect, useState } from "react";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";

const List = ({ token }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    try {
      const response = await axios.get(backendUrl + "/api/product/admin-list", {
        headers: { authorization: token },
      });
      if (response.data.success) {
        setList(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
    setLoading(false);
  };

  const toggleRestriction = async (id, currentlyRestricted) => {
    const action = currentlyRestricted ? "unrestrict" : "restrict";
    try {
      const response = await axios.patch(
        backendUrl + `/api/product/${id}/${action}`,
        {},
        { headers: { authorization: token } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        setList(prev => prev.map(p => p._id === id ? { ...p, restricted: !currentlyRestricted } : p));
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = list.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(list.length / itemsPerPage);
  const paginate = (n) => setCurrentPage(n);

  const renderPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage <= 3) { pages.push(2, 3, "..."); }
      else if (currentPage >= totalPages - 2) { pages.push("...", totalPages - 2, totalPages - 1); }
      else { pages.push("...", currentPage - 1, currentPage, currentPage + 1, "..."); }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold text-gray-800">All Products</h2>
        <span className="text-sm text-gray-500">{list.length} product{list.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-10">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-500">Loading products...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Table header */}
          <div className="hidden lg:grid grid-cols-[48px_2fr_1fr_1fr_1fr_auto_auto] items-center py-2.5 px-4 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <span></span>
            <span>Product</span>
            <span>Shop</span>
            <span>Category</span>
            <span>Price</span>
            <span>Status</span>
            <span className="text-center">Action</span>
          </div>

          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <p className="text-lg font-medium text-gray-800">No products found</p>
            </div>
          ) : (
            currentItems.map((item) => (
              <div
                key={item._id}
                className={`grid grid-cols-[48px_1fr_auto] lg:grid-cols-[48px_2fr_1fr_1fr_1fr_auto_auto] items-center gap-3 py-3 px-4 border-b border-gray-100 text-sm hover:bg-gray-50/50 transition-colors ${item.restricted ? 'bg-red-50/30' : ''}`}
              >
                {/* Image */}
                <img className="w-10 h-10 object-cover rounded" src={item.image?.[0] || "/placeholder.jpg"} alt={item.name} />

                {/* Product name + mobile info */}
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">{item.name}</p>
                  <div className="lg:hidden text-xs text-gray-500 flex flex-wrap gap-x-3 mt-0.5 items-center">
                    <span>{item.shopName || '—'}</span>
                    <span>{item.category}</span>
                    <span className="font-medium">{currency}{item.price}</span>
                    {item.restricted && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Restricted
                      </span>
                    )}
                  </div>
                </div>

                {/* Shop - desktop */}
                <div className="hidden lg:block">
                  <p className="text-gray-700 text-sm truncate">{item.shopName || '—'}</p>
                  <p className="text-gray-400 text-xs truncate">{item.sellerName || ''}</p>
                </div>

                {/* Category - desktop */}
                <p className="hidden lg:block text-gray-600">{item.category}</p>

                {/* Price - desktop */}
                <p className="hidden lg:block font-medium text-gray-800">{currency}{item.price}</p>

                {/* Status badge - desktop */}
                <div className="hidden lg:block">
                  {item.restricted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Restricted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active
                    </span>
                  )}
                </div>

                {/* Action */}
                <div className="justify-self-end lg:justify-self-center">
                  <button
                    onClick={() => toggleRestriction(item._id, item.restricted)}
                    className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors cursor-pointer ${
                      item.restricted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                    }`}
                  >
                    {item.restricted ? "Unrestrict" : "Restrict"}
                  </button>
                </div>
              </div>
            ))
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 py-4 border-t border-gray-100">
              <button onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                className={`w-8 h-8 rounded border flex justify-center items-center text-sm ${currentPage === 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"}`}>
                &lt;
              </button>
              {renderPageNumbers().map((num, idx) =>
                num === "..." ? (
                  <span key={idx} className="text-gray-400 px-1">…</span>
                ) : (
                  <button key={idx} onClick={() => paginate(num)}
                    className={`px-3 py-1 rounded text-sm font-medium ${currentPage === num ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    {num}
                  </button>
                )
              )}
              <button onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                className={`w-8 h-8 rounded border flex justify-center items-center text-sm ${currentPage === totalPages ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"}`}>
                &gt;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default List;
