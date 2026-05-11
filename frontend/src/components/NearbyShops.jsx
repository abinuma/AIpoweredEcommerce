import { useState, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ShopCard from "./ShopCard";
import axios from "axios";

const NearbyShops = () => {
  const { backendUrl } = useContext(ShopContext);
  const canUseGeolocation = typeof navigator !== "undefined" && "geolocation" in navigator;
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(canUseGeolocation);
  const [error, setError] = useState(canUseGeolocation ? null : "no-geo");
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!canUseGeolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        setError("denied");
        setLoading(false);
      },
      { timeout: 10000 },
    );
  }, [canUseGeolocation]);

  useEffect(() => {
    if (!coords) return;

    const fetchShops = async () => {
      try {
        const shopRes = await axios.get(
          `${backendUrl}/api/location/nearby-shops?lat=${coords.lat}&lng=${coords.lng}&radius=50`,
        );
        if (shopRes.data.success) setShops(shopRes.data.shops);
      } catch {
        setError("failed");
      }
      setLoading(false);
    };

    fetchShops();
  }, [backendUrl, coords]);

  if (error === "denied") {
    return (
      <div className="text-center py-10">
        <p className="text-gray-400 text-sm">
          Enable location to discover shops near you
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-black underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (error || (!loading && shops.length === 0)) return null;

  return (
    <div className="my-10">
      <div className="text-center py-6 text-3xl">
        <Title text1="SHOPS" text2="NEAR YOU" />
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[200px] h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        shops.length > 0 && (
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {shops.slice(0, 3).map((shop) => (
              <ShopCard key={shop.id} shop={shop} compact />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default NearbyShops;
