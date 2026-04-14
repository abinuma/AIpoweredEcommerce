import React from "react";
import { useState } from "react";
import { backendUrl, currency } from "../App";
import axios from "axios";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  // -------- Pagination state (NEW)
  const [currentPage, setCurrentPage] = useState(1); 
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchAllOrders = async () => {
    if (!token) {
      return null;
    }
    setLoading(true);
    try {
      const response = await axios.get(
        backendUrl + "/api/order/list",

        { headers: { Authorization: token } },
      );
      if (response.data.success) {
        setOrders(response.data.orders.reverse());
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
    setLoading(false);
  };

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.patch(
        backendUrl + "/api/order/status",
        { orderId, status: event.target.value },
        { headers: { Authorization: token } },
      );
      if (response.data.success) {
        await fetchAllOrders();
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [token]);

   // -------- Calculate pagination (NEW)
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage; 
  const currentItems = orders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber); 

   // -------- Helper to render page numbers with ellipsis (NEW)
  // -------- Helper to render page numbers with fixed ellipsis logic
const renderPageNumbers = () => {
  const pageNumbers = [];

  if (totalPages <= 4) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1, 2, 3);
    pageNumbers.push("...");
    pageNumbers.push(totalPages);
  }

  return pageNumbers; // ✅ CORRECT
};


  return (
    <div>
      <h3 className="mb-4 text-xl ">Order Page</h3>
      {loading ? (
        // 🚀 Professional Spinner
        <div className="flex flex-col justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-500 text-sm font-medium">
            Loading orders...
          </p>
        </div>
      ) : orders.length === 0 ? (
        // Empty State
        <div className="flex justify-center items-center py-20">
          <p className="text-gray-400 text-lg">No orders found</p>
        </div>
      ) : (
        <div>
          {currentItems.map((order, index) => (
            <div
              className=" grid 
  grid-cols-1 
  md:grid-cols-[0.5fr_2fr_1fr]  
  lg:grid-cols-[0.5fr_2fr_1fr_1fr_1fr] 
  gap-3 items-start border-2 border-gray-200 
  p-5 md:p-8 md:my-4 
  text-xs sm:text-sm text-gray-700"
              key={index}
            >
              <img className="w-12" src={assets.parcel_icon} alt="" />
              <div>
                <div>
                  {order.items.map((item, index) => {
                    if (index === order.items.length - 1) {
                      return (
                        <p className="py-0.5" key={index}>
                          {" "}
                          {item.name} X {item.quantity}{" "}
                          <span> {item.size} </span>{" "}
                        </p>
                      );
                    } else {
                      return (
                        <p className="py-0.5" key={index}>
                          {" "}
                          {item.name} X {item.quantity}{" "}
                          <span> {item.size} </span> ,
                        </p>
                      );
                    }
                  })}
                </div>
                <p className="mt-3 mb-2 font-medium">
                  {order.address.firstName + " " + order.address.lastName}{" "}
                </p>
                <div>
                  <p className="text-sm text-gray-600">
                    {order.address.street}
                    <br />
                    <span className="font-medium">
                      {order.address.city}, {order.address.state}
                    </span>
                    <br />
                    <span className="text-gray-500">
                      {order.address.country} - {order.address.zipcode}
                    </span>
                  </p>
                </div>
                <p> {order.address.phone} </p>
              </div>
              <div>
                <p className="text-sm sm:text-[15px]">
                  Items : {order.items.length}{" "}
                </p>
                <p className="mt-3">Method : {order.paymentMethod} </p>
                <p>Payment : {order.payment ? "Done" : "Pending"} </p>
                <p>Date : {new Date(order.date).toLocaleString()} </p>
              </div>
              <p className="text-sm sm:text-[15px]">
                {currency}
                {order.amount}{" "}
              </p>
              <select
                onChange={(event) => statusHandler(event, order._id)}
                value={order.status}
                className={`p-2 font-semibold rounded ${
                  order.status === "Delivered"
                    ? "bg-green-100 text-green-700"
                    : order.status === "Shipped"
                      ? "bg-blue-100 text-blue-700"
                      : order.status === "Packing"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                }`} //this styles are for better visualization of status . does the colors fit the status?
              >
                <option value="Order Placed">Order Placed</option>
                <option value="Packing">Packing</option>
                <option value="Shipped">Shipped</option>{" "}
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
            </div>
          ))}

          {/* ---------- Pagination Controls (NEW) */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6 flex-wrap">
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

              {renderPageNumbers().map((num, idx) =>
                num === "..." ? (
                  <span key={idx} className="text-purple-700 px-1">
                    ...
                  </span>
                ) : (
                  <button
                    key={idx}
                    onClick={() => paginate(num)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      currentPage === num
                        ? "text-purple-700 underline underline-offset-4 cursor-default"
                        : "text-purple-700 hover:bg-neutral-200 hover:shadow-md"
                    }`}
                  >
                    {num}
                  </button>
                ),
              )}

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
    </div>
  );
};

export default Orders;
