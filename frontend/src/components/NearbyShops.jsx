import { useState, useEffect, useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import ProductItem from "./ProductItem";
import Title from "./Title";
import axios from "axios";

const NearbyShops = () => {
  const { backendUrl } = useContext(ShopContext);
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) { setError("no-geo"); setLoading(false); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { setError("denied"); setLoading(false); },
      { timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    const fetch = async () => {
      try {
        const [shopRes, prodRes] = await Promise.all([
          axios.get(backendUrl + `/api/location/nearby-shops?lat=${coords.lat}&lng=${coords.lng}&radius=50`),
          axios.get(backendUrl + `/api/location/nearby-products?lat=${coords.lat}&lng=${coords.lng}&radius=50&limit=8`)
        ]);
        if (shopRes.data.success) setShops(shopRes.data.shops);
        if (prodRes.data.success) setProducts(prodRes.data.products);
      } catch (e) { setError("failed"); }
      setLoading(false);
    };
    fetch();
  }, [coords]);

  if (error === "denied") return (
    <div className="text-center py-10">
      <p className="text-gray-400 text-sm">📍 Enable location to discover shops near you</p>
      <button onClick={() => window.location.reload()} className="mt-2 text-sm text-black underline">Try Again</button>
    </div>
  );
  if (error || (!loading && shops.length === 0 && products.length === 0)) return null;

  return (
    <div className="my-10">
      <div className="text-center py-6 text-3xl"><Title text1="SHOPS" text2="NEAR YOU" /></div>

      {loading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1,2,3].map(i => <div key={i} className="min-w-[200px] h-24 bg-gray-100 rounded-lg animate-pulse"/>)}
        </div>
      ) : (
        <>
          {shops.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {shops.map(shop => (
                <div key={shop.id} className="min-w-[200px] bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex-shrink-0 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg mb-2">🏪</div>
                  <p className="font-medium text-sm">{shop.shop_name || shop.name}</p>
                  <p className="text-xs text-gray-500">{shop.name}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">📍 {shop.distance_km} km away</p>
                </div>
              ))}
            </div>
          )}

          {products.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-gray-600 mb-4">Products from nearby sellers</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
                {products.map((item, idx) => (
                  <div key={idx} className="relative">
                    <ProductItem name={item.name} id={item.id || item._id} price={item.price} image={item.image} />
                    {item.distance_km && (
                      <span className="absolute top-2 right-2 bg-white/90 text-xs px-2 py-0.5 rounded-full text-blue-600 font-medium shadow-sm">
                        {item.distance_km} km
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NearbyShops;
