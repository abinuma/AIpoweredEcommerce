import { useState, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";

const SellerRequest = () => {
  const { backendUrl, token, navigate } = useContext(ShopContext);
  const [shopName, setShopName] = useState("");
  const [businessDetail, setBusinessDetail] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locLoading, setLocLoading] = useState(false);

  if (!token) { navigate("/login"); return null; }

  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitude(pos.coords.latitude.toFixed(6)); setLongitude(pos.coords.longitude.toFixed(6)); setLocLoading(false); },
      () => { toast.error("Location access denied"); setLocLoading(false); },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) { toast.error("Shop name is required"); return; }
    if (!businessDetail.trim()) { toast.error("Business details are required"); return; }
    setSubmitting(true);
    try {
      const res = await axios.post(backendUrl + "/api/request/seller-request",
        { shop_name: shopName, business_detail: businessDetail, latitude: parseFloat(latitude) || null, longitude: parseFloat(longitude) || null },
        { headers: { Authorization: token } }
      );
      if (res.data.success) { setSubmitted(true); } 
      else { toast.error(res.data.message); }
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
    setSubmitting(false);
  };

  if (submitted) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-3xl mb-4">✓</div>
      <h2 className="text-2xl font-medium mb-2">Application Submitted!</h2>
      <p className="text-gray-500 max-w-md">Your seller application has been submitted successfully. Our team will review it and get back to you shortly.</p>
      <button onClick={() => navigate("/")} className="mt-6 bg-black text-white px-8 py-3 text-sm">Back to Home</button>
    </div>
  );

  return (
    <div className="border-t pt-14">
      <div className="text-center text-2xl mb-6"><Title text1="BECOME A" text2="SELLER" /></div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-[90%] sm:max-w-lg m-auto gap-5">
        <div className="w-full">
          <p className="mb-1 text-sm font-medium">Shop Name *</p>
          <input value={shopName} onChange={e => setShopName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-gray-500" placeholder="Your shop name" required />
        </div>
        <div className="w-full">
          <p className="mb-1 text-sm font-medium">Business Details *</p>
          <textarea value={businessDetail} onChange={e => setBusinessDetail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-gray-500 resize-none" rows={4} placeholder="Tell us about your business, what products you sell, etc." required />
        </div>
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Shop Location (optional)</p>
            <button type="button" onClick={useMyLocation} disabled={locLoading} className="text-xs text-blue-600 hover:underline cursor-pointer">
              {locLoading ? "Detecting..." : "📍 Use My Location"}
            </button>
          </div>
          <div className="flex gap-3">
            <input value={latitude} onChange={e => setLatitude(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded outline-none focus:border-gray-500" placeholder="Latitude" type="number" step="any" />
            <input value={longitude} onChange={e => setLongitude(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded outline-none focus:border-gray-500" placeholder="Longitude" type="number" step="any" />
          </div>
        </div>
        <button type="submit" disabled={submitting} className="bg-black text-white px-10 py-3 text-sm mt-2 disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors">
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </form>
    </div>
  );
};

export default SellerRequest;
