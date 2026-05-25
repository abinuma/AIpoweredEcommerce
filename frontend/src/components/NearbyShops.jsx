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
        if (shopRes.data.success) {
          setShops(shopRes.data.shops);
        }
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
          type="button"
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-black underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (error || (!loading && shops.length === 0)) return null;

  const nearestThree = [...shops]
    .sort((a, b) => (a.distance_km ?? a.distance ?? 0) - (b.distance_km ?? b.distance ?? 0))
    .slice(0, 3);

  return (
    <div className="my-10">
      <div className="text-center py-6 text-3xl">
        <Title text1="SHOPS" text2="NEAR YOU" />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-h-[380px] bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
          {nearestThree.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
};

export default NearbyShops;
