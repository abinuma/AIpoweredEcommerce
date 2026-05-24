import React, { useState, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import ShopCard from "../components/ShopCard";
import axios from "axios";

const Shops = () => {
  const { backendUrl } = useContext(ShopContext);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await axios.get(backendUrl + "/api/location/all-shops");
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          Failed to load shops: {error}
        </div>
      ) : shops.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
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
