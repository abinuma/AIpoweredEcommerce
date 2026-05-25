import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ShopContext } from "../../context/ShopContext";

const ShopProfile = ({ token }) => {
  const { backendUrl } = useContext(ShopContext);
  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await axios.get(backendUrl + "/api/user/profile", {
          headers: { Authorization: token },
        });
        if (res.data.success && res.data.user) {
          setShopName(res.data.user.shop_name || "");
          setShopDescription(res.data.user.shop_description || "");
        } else {
          toast.error(res.data.message || "Failed to load profile");
        }
      } catch (e) {
        toast.error(e.response?.data?.message || e.message);
      }
      setLoading(false);
    };
    if (token) loadProfile();
  }, [token, backendUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast.error("Shop name is required");
      return;
    }
    if (!shopDescription.trim()) {
      toast.error("Shop description is required");
      return;
    }
    setSaving(true);
    try {
      const res = await axios.post(
        backendUrl + "/api/user/update-shop-profile",
        { shop_name: shopName, shop_description: shopDescription },
        { headers: { Authorization: token } },
      );
      if (res.data.success) {
        toast.success(res.data.message);
      } else {
        toast.error(res.data.message);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center py-16">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-black rounded-full animate-spin" />
        <p className="mt-3 text-gray-500 text-sm">Loading shop profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">Shop Profile</h2>
      <p className="text-sm text-gray-500 mb-6">
        Update your shop name and short description shown to customers.
      </p>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
          <input
            type="text"
            value={shopName}
            onChange={(e) => setShopName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-gray-500"
            placeholder="Your shop name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Shop Description</label>
          <input
            type="text"
            value={shopDescription}
            onChange={(e) => {
              if (e.target.value.length <= 30) setShopDescription(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-gray-500"
            placeholder="Fashion, Electronics..."
            required
          />
          <p className="text-xs text-gray-400 mt-1">{shopDescription.length}/30 characters</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-gray-800 text-white px-6 py-2.5 text-sm rounded hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default ShopProfile;
