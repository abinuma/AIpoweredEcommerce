import { Link } from "react-router-dom";

const ShopCard = ({ shop, compact = false }) => {
  const shopName = shop.shop_name || shop.name || "Shop";
  const shopDescription = shop.shop_description || "";

  return (
    <Link
      to={`/shops/${shop.id}`}
      className={`block bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow ${
        compact ? "min-w-[200px] p-4 flex-shrink-0" : "p-6"
      }`}
      aria-label={`View products from ${shopName}`}
    >
      <div
        className={`rounded-full bg-gray-100 flex items-center justify-center font-semibold text-gray-700 mb-4 ${
          compact ? "w-10 h-10 text-sm" : "w-12 h-12 text-base"
        }`}
      >
        {shopName.slice(0, 1).toUpperCase()}
      </div>
      <h3 className={`font-medium text-gray-800 ${compact ? "text-sm" : "text-lg"} mb-1`}>
        {shopName}
      </h3>
      {shopDescription && (
  <p className="text-sm text-gray-500">
    {shopDescription}
  </p>
)}
      {shop.distance_km !== undefined && (
        <p className="text-xs text-blue-600 mt-1 font-medium">
          {shop.distance_km} km away
        </p>
      )}
    </Link>
  );
};

export default ShopCard;
