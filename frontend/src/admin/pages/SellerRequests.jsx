import React, { useEffect, useState } from "react";
import { backendUrl } from "../App";
import axios from "axios";
import { toast } from "react-toastify";

const SellerRequests = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openRequest, setOpenRequest] = useState(null);

  const fetchRequests = async () => {
    if (!token) return;

    setLoading(true);

    try {
      const res = await axios.get(backendUrl + "/api/request/seller-request", {
        headers: { Authorization: token },
      });

      if (res.data.success) {
        setRequests(res.data.requests);
      } else {
        toast.error(res.data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleAction = async (id, status) => {
    try {
      const res = await axios.patch(
        backendUrl + "/api/request/verify-request",
        { id, status },
        {
          headers: { Authorization: token },
        },
      );

      if (res.data.success) {
        toast.success(`Request ${status}`);
        fetchRequests();
      } else {
        toast.error(res.data.message);
      }
    } catch (e) {
      toast.error(e.message);
    }
  };

  const statusColor = (status) => {
    if (status === "approved") {
      return "bg-green-100 text-green-700";
    }

    if (status === "rejected") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="w-full">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          Seller Requests
        </h1>

        <p className="text-sm text-gray-500 mt-1">Review seller applications</p>
      </div>

      {/* LOADING */}
      {loading ? (
        <div className="flex flex-col items-center py-16">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />

          <p className="mt-4 text-gray-500">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
          <p className="text-gray-400">No seller requests found</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
            >
              {/* TOP SECTION */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {req.shop_name}
                    </h2>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(
                        req.status,
                      )}`}
                    >
                      {(req.status || "pending").charAt(0).toUpperCase() +
                        (req.status || "pending").slice(1)}
                    </span>
                  </div>

                  {req.created_at && (
                    <p className="text-xs text-gray-400 mt-2">
                      Submitted on {new Date(req.created_at).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setOpenRequest(openRequest === req.id ? null : req.id)
                    }
                    className="border border-gray-300 hover:border-black px-4 py-2 rounded-lg text-sm transition-all cursor-pointer"
                  >
                    {openRequest === req.id ? "Hide Details" : "View Details"}
                  </button>

                  {(!req.status || req.status === "pending") && (
                    <>
                      <button
                        onClick={() => handleAction(req.id, "approved")}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                      >
                        Approve
                      </button>

                      <button
                        onClick={() => handleAction(req.id, "rejected")}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* EXPANDED DETAILS */}
              {openRequest === req.id && (
                <div className="mt-6 border-t pt-6 grid gap-5">
                  {/* SHOP DESCRIPTION */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                      Shop Description
                    </p>

                    <p className="text-sm text-gray-700">
                      {req.shop_description || "No description"}
                    </p>
                  </div>

                  {/* BUSINESS DETAIL */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                      Business Details
                    </p>

                    <p className="text-sm text-gray-700 leading-relaxed">
                      {req.business_detail}
                    </p>
                  </div>

                  {/* REQUESTER EMAIL */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                      Requester Email
                    </p>

                    <p className="text-sm text-gray-700">
                      {req.email || "No email"}
                    </p>
                  </div>

                  {/* LOCATION */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-1">
                      Seller Location
                    </p>

                    <p className="text-sm text-gray-700">
                      {req.latitude && req.longitude ? (
                        <span className="text-green-600 font-medium">
                          Location provided
                        </span>
                      ) : (
                        <span className="text-gray-400">
                          Location not available
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerRequests;
