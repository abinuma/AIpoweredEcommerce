import { useState, useContext, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import axios from "axios";
import { toast } from "react-toastify";
import Title from "../components/Title";

const SellerRequest = () => {
  const { backendUrl, token, navigate, setRole } = useContext(ShopContext);
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [businessDetail, setBusinessDetail] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null);
  const [checking, setChecking] = useState(true);

  if (!token) { navigate("/login"); return null; }

  // Check request status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(backendUrl + "/api/request/status", { headers: { Authorization: token } });
        if (res.data.success) {
          setRequestStatus(res.data.status);
        }
      } catch (e) {
        console.error("Error checking status", e);
      }
      setChecking(false);
    };
    if (token) checkStatus();
  }, [token]);

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
        {
          shop_name: shopName,
          shop_description: shopDescription,
          business_detail: businessDetail,
          latitude: parseFloat(latitude) || null, longitude: parseFloat(longitude) || null
        },
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

  if (checking) {
    return <div className="py-20 text-center">Loading...</div>;
  }

  if (requestStatus === "pending") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl mb-4">⏳</div>
        <h2 className="text-2xl font-medium mb-2">Application Pending</h2>
        <p className="text-gray-500 max-w-md">Your seller request is pending approval.</p>
        <button onClick={() => navigate("/")} className="mt-6 bg-black text-white px-8 py-3 text-sm">Back to Home</button>
      </div>
    );
  }

  if (requestStatus === "approved") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-2xl mb-4">✓</div>
        <h2 className="text-2xl font-medium mb-2">You&apos;re a Seller</h2>
        <p className="text-gray-500 max-w-md">Your seller account is active. Manage products from the seller panel. <br /> Reload the page to see changes </p>
        <button onClick={() => {
          setRole("seller");
          localStorage.setItem("role", "seller");
          navigate("/seller");
        }} className="mt-6 bg-black text-white px-8 py-3 text-sm">Go to Seller Panel</button>
      </div>
    );
  }

  return (
    <div className="border-t py-14">
      <div className="text-center text-2xl mb-6"><Title text1="BECOME A" text2="SELLER" /></div>
      <form onSubmit={handleSubmit} className="flex flex-col items-center w-[90%] sm:max-w-lg m-auto gap-5">
        <div className="w-full">
          <p className="mb-1 text-sm font-medium">Shop Name *</p>
          <input value={shopName} onChange={e => setShopName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-gray-500" placeholder="Your shop name" required />
        </div>

        <div className="w-full">
          <p className="mb-1 text-sm font-medium">Short Shop Description *</p>

          <input
            value={shopDescription}
            onChange={(e) => {
              if (e.target.value.length <= 30) {
                setShopDescription(e.target.value);
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-gray-500"
            placeholder="Fashion, Electronics..."
            required
          />

          <p className="text-xs text-gray-400 mt-1">
            {shopDescription.length}/30 characters
          </p>
        </div>

        <div className="w-full">
          <p className="mb-1 text-sm font-medium">Business Details *</p>
          <textarea value={businessDetail} onChange={e => setBusinessDetail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-gray-500 resize-none" rows={4} placeholder="Tell us about your business, what products you sell, etc." required />
        </div>
        <div className="w-full">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-medium">Shop Location</p>
            <button type="button" onClick={useMyLocation} disabled={locLoading} className="text-xs text-blue-600 hover:underline cursor-pointer">
              {locLoading ? "Detecting..." : "📍 click here to set automatically"}
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
