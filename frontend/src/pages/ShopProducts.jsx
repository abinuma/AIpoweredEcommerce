import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import ProductGrid from "../components/ProductGrid";

const ShopProducts = () => {
  const { shopId } = useParams();
  const { backendUrl } = useContext(ShopContext);
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortType, setSortType] = useState("newest");

  useEffect(() => {
    const fetchShopProducts = async () => {
      setLoading(true);
      setError("");

      try {
        const [shopsResponse, productsResponse] = await Promise.all([
          axios.get(`${backendUrl}/api/location/all-shops`),
          axios.get(`${backendUrl}/api/product/list?seller_id=${shopId}`),
        ]);

        if (!shopsResponse.data.success) {
          throw new Error(shopsResponse.data.message || "Unable to load shop");
        }
        if (!productsResponse.data.success) {
          throw new Error(productsResponse.data.message || "Unable to load products");
        }

        setShop(
          shopsResponse.data.shops.find((item) => String(item.id) === String(shopId)) || null,
        );
        setProducts(productsResponse.data.products || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchShopProducts();
  }, [backendUrl, shopId]);

  const sortedProducts = useMemo(() => {
    const productsCopy = products.slice();

    switch (sortType) {
      case "low-high":
        return productsCopy.sort((a, b) => a.price - b.price);
      case "high-low":
        return productsCopy.sort((a, b) => b.price - a.price);
      default:
        return productsCopy;
    }
  }, [products, sortType]);

  const shopName = shop?.shop_name || shop?.name || "Shop";

  return (
    <div className="pt-10 border-t">
      <Link to="/shops" className="text-sm text-gray-500 hover:text-gray-800">
        Back to shops
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-6 mb-8">
        <div>
          <div className="text-2xl">
            <Title text1={shop ? shopName.toUpperCase() : "SHOP"} text2="PRODUCTS" />
          </div>
          {shop?.name && shop?.shop_name && (
            <p className="text-sm text-gray-500">Shop owner: {shop.name}</p>
          )}
        </div>

        <select
          value={sortType}
          onChange={(e) => setSortType(e.target.value)}
          className="border-2 border-gray-300 text-sm px-3 py-2 w-full sm:w-auto max-w-[220px]"
        >
          <option value="newest">Sort by: Newest</option>
          <option value="low-high">Sort by: Low to High</option>
          <option value="high-low">Sort by: High to Low</option>
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <div key={item} className="h-64 bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">
          Failed to load shop products: {error}
        </div>
      ) : !shop ? (
        <div className="text-center py-10 text-gray-500">
          This shop could not be found.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          <ProductGrid
            products={sortedProducts}
            emptyMessage="This shop has not added products yet."
          />
        </div>
      )}
    </div>
  );
};

export default ShopProducts;
