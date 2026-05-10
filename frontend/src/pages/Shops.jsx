import React, { useState, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";

const Shops = () => {
  const { backendUrl } = useContext(ShopContext);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get(backendUrl + '/api/location/all-shops');
        if (response.data.success) {
          setShops(response.data.shops);
        } else {
          setError(response.data.message);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, [backendUrl]);

  return (
    <div className="pt-10 border-t">
      <div className="text-2xl mb-8">
        <Title text1="ALL" text2="SHOPS" />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          Failed to load shops: {error}
        </div>
      ) : shops.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl mb-4">
                🏪
              </div>
              <h3 className="font-medium text-lg mb-1">{shop.shop_name || shop.name}</h3>
              <p className="text-sm text-gray-500">{shop.name}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-500">
          No shops found on the platform yet.
        </div>
      )}
    </div>
  );
};

export default Shops;
