import axios from "axios";
import React, { useEffect, useState } from "react";
import { useContext } from "react";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";
import ReviewManager from "../components/ReviewManager";
import { getTotalSizeStock } from "../../utils/productSizes";

const List = ({ token }) => {
  const { currency, backendUrl } = useContext(ShopContext);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
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

  const removeProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const response = await axios.delete(backendUrl + `/api/product/${id}`, {
        headers: { authorization: token },
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

  const getProductStatus = (item) => {
    if (item.restricted) return "restricted";
    const totalSizeStock = getTotalSizeStock(item.sizes);
    if (totalSizeStock !== null) {
      if (totalSizeStock === 0) return "out_of_stock";
    } else if ((item.stockQuantity || item.stock_quantity || 0) === 0) {
      return "out_of_stock";
    }
    return "active";
  };

  const StatusBadge = ({ status }) => {
    const config = {
      active: { label: "Active", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
      restricted: { label: "Restricted", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
      out_of_stock: { label: "Out of Stock", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
    };
    const c = config[status] || config.active;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${c.bg} ${c.text} ${c.border}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`}></span>
        {c.label}
      </span>
    );
  };

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
      if (currentPage <= 3) { pages.push(2, 3, "...");  }
      else if (currentPage >= totalPages - 2) { pages.push("...", totalPages - 2, totalPages - 1); }
      else { pages.push("...", currentPage - 1, currentPage, currentPage + 1, "..."); }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">My Products</h2>
        <span className="text-sm text-gray-500">{list.length} product{list.length !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="flex flex-col items-center py-10">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
          <p className="mt-3 text-gray-500">Loading products...</p>
        </div>
      ) : (
        <div>
          {/* Table header */}
          <div className="hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_auto_1fr] items-center py-2 px-3 border bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide rounded-t">
            <span>Image</span>
            <span>Name</span>
            <span>Category</span>
            <span>Price</span>
            <span>Status</span>
            <span className="text-center">Action</span>
          </div>

          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white border-x border-b">
              <div className="text-4xl mb-3">📦</div>
              <p className="text-lg font-medium text-gray-800">No products added yet</p>
              <p className="text-sm mt-1">Start adding products to build your shop inventory.</p>
            </div>
          ) : (
            currentItems.map((item) => {
              const status = getProductStatus(item);
              return (
                <React.Fragment key={item._id}>
                  <div className={`grid grid-cols-[80px_1fr_auto] md:grid-cols-[1fr_3fr_1fr_1fr_auto_1fr] items-center gap-3 py-3 px-3 border-b text-sm ${status === 'restricted' ? 'bg-red-50/40' : 'bg-white'}`}>
                    {/* Image */}
                    <div className="w-12">
                      <img className="w-12 h-12 object-cover rounded" src={item.image?.[0] || "/placeholder.jpg"} alt={item.name} />
                    </div>

                    {/* Name + mobile info */}
                    <div className="flex flex-col gap-1 md:block min-w-0">
                      <p className="font-medium text-gray-800 truncate">{item.name}</p>
                      <div className="md:hidden text-xs text-gray-500 flex flex-wrap gap-x-3 items-center">
                        <span>{item.category}</span>
                        <span className="font-medium">{currency}{item.price}</span>
                        <StatusBadge status={status} />
                      </div>
                    </div>

                    {/* Category */}
                    <p className="hidden md:block text-gray-600">{item.category}</p>

                    {/* Price */}
                    <p className="hidden md:block font-medium text-gray-800">{currency}{item.price}</p>

                    {/* Status badge */}
                    <div className="hidden md:block">
                      <StatusBadge status={status} />
                    </div>

                    {/* Actions */}
                    <div className="justify-self-end md:justify-self-center flex gap-2">
                      <button
                        onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded border border-gray-300"
                      >
                        Reviews
                      </button>
                      <button
                        onClick={() => removeProduct(item._id)}
                        className="text-gray-400 hover:text-red-600 text-lg font-bold px-2 py-1"
                        title="Remove product"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {expandedId === item._id && (
                    <div className="col-span-full mb-3 ml-16 mr-2">
                      <ReviewManager productId={item._id} token={token} />
                    </div>
                  )}
                </React.Fragment>
              );
            })
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
              <button onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                className={`w-9 h-9 rounded-full border flex justify-center items-center text-sm ${currentPage === 1 ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"}`}>
                &lt;
              </button>
              {renderPageNumbers().map((num, idx) =>
                num === "..." ? (
                  <span key={idx} className="text-gray-400 px-1">…</span>
                ) : (
                  <button key={idx} onClick={() => paginate(num)}
                    className={`px-3 py-1.5 rounded text-sm font-medium ${currentPage === num ? "bg-gray-800 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    {num}
                  </button>
                )
              )}
              <button onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                className={`w-9 h-9 rounded-full border flex justify-center items-center text-sm ${currentPage === totalPages ? "border-gray-200 text-gray-300 cursor-not-allowed" : "border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"}`}>
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
