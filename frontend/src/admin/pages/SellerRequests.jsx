import React, { useEffect, useState } from "react";
import { backendUrl } from "../App";
import axios from "axios";
import { toast } from "react-toastify";

const SellerRequests = ({ token }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axios.get(backendUrl + "/api/request/seller-request", { headers: { Authorization: token } });
      if (res.data.success) setRequests(res.data.requests);
      else toast.error(res.data.message);
    } catch (e) { toast.error(e.message); }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [token]);

  const handleAction = async (id, status) => {
    try {
      const res = await axios.patch(backendUrl + "/api/request/verify-request", { id, status }, { headers: { Authorization: token } });
      if (res.data.success) { toast.success(`Request ${status}`); fetchRequests(); }
      else toast.error(res.data.message);
    } catch (e) { toast.error(e.message); }
  };

  const statusColor = (s) => {
    if (s === "approved") return "bg-green-100 text-green-700";
    if (s === "rejected") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div>
      <p className="flex flex-col gap-2 my-4 text-xl">Seller Requests</p>
      {loading ? (
        <div className="flex flex-col items-center py-10">
          <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
          <p className="mt-3 text-gray-500">Loading requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <p className="text-center text-gray-400 py-10">No seller requests found</p>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((req) => (
            <div key={req.id} className="border border-gray-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-medium">{req.shop_name}</p>
                <p className="text-sm text-gray-500 mt-1">{req.business_detail}</p>
                {req.latitude && <p className="text-xs text-gray-400 mt-1">📍 {req.latitude}, {req.longitude}</p>}
                <p className="text-xs text-gray-400 mt-1">User: {req.user_id?.substring(0, 8)}...</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor(req.status)}`}>
                  {(req.status || "pending").charAt(0).toUpperCase() + (req.status || "pending").slice(1)}
                </span>
                {(!req.status || req.status === "pending") && (
                  <>
                    <button onClick={() => handleAction(req.id, "approved")} className="bg-green-600 text-white px-4 py-1.5 text-xs rounded hover:bg-green-700 cursor-pointer">Approve</button>
                    <button onClick={() => handleAction(req.id, "rejected")} className="bg-red-500 text-white px-4 py-1.5 text-xs rounded hover:bg-red-600 cursor-pointer">Reject</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerRequests;
