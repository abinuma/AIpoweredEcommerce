import { Link, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";

const ShopCard = ({ shop, compact = false }) => {
  const shopName = shop.shop_name || shop.name || "Shop";
  const shopDescription = shop.shop_description || "";
  const navigate = useNavigate();

  const { products, backendUrl } = useContext(ShopContext);
  const [ratedProducts, setRatedProducts] = useState([]);
  const [defaultProduct, setDefaultProduct] = useState(null);

  useEffect(() => {
    if (!products || products.length === 0) return;
    const sp = products.filter((p) => String(p.seller_id) === String(shop.id));
    if (sp.length === 0) return;

    const best = sp.find((p) => p.bestseller) || sp[0];
    setDefaultProduct(best);

    const fetchRatings = async () => {
      try {
        const results = await Promise.all(
          sp.slice(0, 8).map(async (p) => {
            try {
              const res = await fetch(backendUrl + `/api/review/${p._id}`);
              const data = await res.json();
              if (data.success && data.stats && data.stats.total_reviews > 0) {
                return { ...p, rating: data.stats.average_rating };
              }
            } catch (e) {
              // ignore fetch errors
            }
            return null;
          })
        );
        const rated = results.filter(Boolean).sort((a, b) => b.rating - a.rating);
        setRatedProducts(rated);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRatings();
  }, [products, shop.id, backendUrl]);

  const RatingBadge = ({ rating }) => (
    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1 backdrop-blur-sm z-10">
      <span className="text-yellow-400">★</span> {rating.toFixed(1)}
    </div>
  );

  const ProductImage = ({ product, className }) => (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/product/${product._id}`);
      }}
      className={`relative cursor-pointer overflow-hidden group ${className}`}
    >
      {product.rating > 0 && <RatingBadge rating={product.rating} />}
      <img
        src={Array.isArray(product.image) ? product.image[0] : product.image}
        alt={product.name}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );

  const renderImages = () => {
    if (ratedProducts.length === 0) {
      if (!defaultProduct) {
        return (
          <div className="w-full h-56 bg-gray-50 border flex items-center justify-center text-gray-400 text-sm rounded-lg">
            No Products Available
          </div>
        );
      }
      return <ProductImage product={defaultProduct} className="w-full h-56 rounded-lg" />;
    }

    if (ratedProducts.length >= 4) {
      return (
        <div className="w-full h-56 grid grid-cols-2 grid-rows-2 gap-1 rounded-lg overflow-hidden">
          <ProductImage product={ratedProducts[0]} className="w-full h-full" />
          <ProductImage product={ratedProducts[1]} className="w-full h-full" />
          <ProductImage product={ratedProducts[2]} className="w-full h-full" />
          <ProductImage product={ratedProducts[3]} className="w-full h-full" />
        </div>
      );
    }

    if (ratedProducts.length === 3) {
      return (
        <div className="w-full h-56 flex flex-col gap-1 rounded-lg overflow-hidden">
          <ProductImage product={ratedProducts[0]} className="w-full h-2/3" />
          <div className="w-full h-1/3 grid grid-cols-2 gap-1">
            <ProductImage product={ratedProducts[1]} className="w-full h-full" />
            <ProductImage product={ratedProducts[2]} className="w-full h-full" />
          </div>
        </div>
      );
    }

    if (ratedProducts.length === 2) {
      return (
        <div className="w-full h-56 grid grid-cols-2 gap-1 rounded-lg overflow-hidden">
          <ProductImage product={ratedProducts[0]} className="w-full h-full" />
          <ProductImage product={ratedProducts[1]} className="w-full h-full" />
        </div>
      );
    }

    // length === 1
    return <ProductImage product={ratedProducts[0]} className="w-full h-56 rounded-lg" />;
  };

  return (
    <div
      className={`bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden ${
        compact ? "min-w-[280px] p-4 flex-shrink-0" : "p-5 min-h-[380px]"
      }`}
    >
      <div>
        <h3 className={`font-semibold text-gray-800 ${compact ? "text-lg" : "text-xl"} mb-4 text-center tracking-wide`}>
          {shopName}
        </h3>
        
        <div className="w-full mb-5 mx-auto">
          {renderImages()}
        </div>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
        <div className="w-2/3 pr-3">
          {shopDescription ? (
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
              {shopDescription}
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">No description provided</p>
          )}
          {shop.distance_km !== undefined && (
            <p className="text-xs text-blue-600 mt-1.5 font-medium">
              {shop.distance_km} km away
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            navigate(`/shops/${shop.id}`);
          }}
          className="bg-black text-white text-sm font-medium px-5 py-2.5 rounded hover:bg-gray-800 transition-colors whitespace-nowrap shadow-sm"
        >
          Visit Us
        </button>
      </div>
    </div>
  );
};

export default ShopCard;
