import { useState, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";

const ReviewSummary = ({ productId, reviewCount }) => {
  const { backendUrl } = useContext(ShopContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  const fetchSummary = async () => {
    setShowSummary(true);
    setLoading(true);
    try {
      const res = await axios.get(backendUrl + `/api/review/${productId}/summary`);
      if (res.data.success && res.data.summary) setData(res.data);
    } catch (e) { console.log(e); }
    setLoading(false);
  };

  if (!showSummary) {
    return (
      <div className="my-6">
        <button 
          onClick={fetchSummary} 
          className="text-sm font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2"
        >
          See Review Summary
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="my-6 p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"/><div className="h-16 bg-gray-200 rounded"/>
    </div>
  );

  if (!data || !data.summary) {
    return (
      <div className="my-6 p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 text-center text-sm text-gray-500">
          No review summary available yet.
      </div>
    );
  }

  const pros = Array.isArray(data.pros) ? data.pros : (typeof data.pros === "string" ? JSON.parse(data.pros) : []);
  const cons = Array.isArray(data.cons) ? data.cons : (typeof data.cons === "string" ? JSON.parse(data.cons) : []);

  return (
    <div className="my-6 p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">✦</span>
        <p className="font-semibold text-sm text-gray-800">AI Review Summary</p>
        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium ml-auto">Powered by AI</span>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed mb-4">{data.summary}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {pros.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-green-700 mb-2">PROS</p>
            {pros.map((p, i) => <div key={i} className="flex items-start gap-2 mb-1.5"><span className="text-green-500 text-sm mt-0.5">✓</span><p className="text-sm text-gray-600">{p}</p></div>)}
          </div>
        )}
        {cons.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-700 mb-2">CONS</p>
            {cons.map((c, i) => <div key={i} className="flex items-start gap-2 mb-1.5"><span className="text-red-400 text-sm mt-0.5">✗</span><p className="text-sm text-gray-600">{c}</p></div>)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSummary;
