import axios from "axios";
import React, { useEffect, useState } from "react";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";

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
          {/* Table header */}
          <div className="hidden lg:grid grid-cols-[48px_2fr_1fr_1fr_1fr_120px] items-center py-3 px-4 bg-gray-50 border-b text-xs font-semibold text-gray-500 uppercase tracking-wide">
            <div></div>

            <div className="text-left">
              Product
            </div>

            <div className="text-left">
              Shop
            </div>

            <div className="text-left">
              Sub Category
            </div>

            <div className="text-left">
              Price
            </div>
            <div className="text-center">
              Action
            </div>
          </div>

          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <p className="text-lg font-medium text-gray-800">No products found</p>
            </div>
          ) : (
            currentItems.map((item) => (
              <div
                key={item._id}
                className={`grid grid-cols-[48px_1fr_auto] lg:grid-cols-[48px_2fr_1fr_1fr_1fr_120px] items-center gap-3 py-3 px-4 border-b border-gray-100 text-sm hover:bg-gray-50/50 transition-colors ${item.restricted ? "bg-red-50/30" : ""
                  }`}
              >
                {/* Image */}
                <div className="flex justify-center">
                  <img
                    className="w-20 h-15 object-cover rounded"
                    src={item.image?.[0] || "/placeholder.jpg"}
                    alt={item.name}
                  />
                </div>

                {/* Product */}
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {item.name}
                  </p>
                </div>

                {/* Shop */}
                <div className="hidden lg:block min-w-0">
                  <p className="text-gray-700 truncate">
                    {item.shopName || "—"}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {item.sellerName || ""}
                  </p>
                </div>

                {/* Category */}
                <div className="hidden lg:block">
                  <p className="text-gray-600 truncate">
                    {item.subCategory}
                  </p>
                </div>

                {/* Price */}
                <div className="hidden lg:block">
                  <p className="font-medium text-gray-800">
                    {currency}{item.price}
                  </p>
                </div>

                {/* Status */}


                {/* Action */}
                <div className="flex justify-center">
                  <button
                    onClick={() => toggleRestriction(item._id, item.restricted)}
                    className={`text-xs font-medium px-3 py-1.5 rounded border transition-colors cursor-pointer ${item.restricted
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
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={paginate}
            className="py-4 border-t border-gray-100"
          />
        </div>
      )}
    </div>
  );
};

export default List;
