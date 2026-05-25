import React, { useContext, useEffect, useState, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import { useParams } from "react-router-dom";
import RelatedProducts from "../components/RelatedProducts";
import ReviewSection from "../components/ReviewSection";
import ReviewSummary from "../components/ReviewSummary";
import { normalizeProductSizes } from "../utils/productSizes";

const Product = () => {
  const { products, currency, addToCart, backendUrl } = useContext(ShopContext);
  const { productId } = useParams();
  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");
  const [activeTab, setActiveTab] = useState("description");
  const [reviewCount, setReviewCount] = useState(0);
  const [avgRating, setAvgRating] = useState(0);

  const fetchProductData = () => {
    const item = products.find((p) => p._id === productId);
    if (item) {
      setProductData(item);
      setImage(Array.isArray(item.image) ? item.image[0] : item.image);
    }
  };

  // Fetch review stats for the header rating display
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(backendUrl + `/api/review/${productId}`);
        const data = await res.json();
        if (data.success) {
          setReviewCount(data.stats.total_reviews);
          setAvgRating(data.stats.average_rating);
        }
      } catch (e) { console.log(e); }
    };
    if (productId) fetchStats();
  }, [productId]);

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  const sizeOptions = useMemo(
    () => normalizeProductSizes(productData?.sizes),
    [productData?.sizes],
  );

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? "#f59e0b" : "#d1d5db", fontSize: "14px" }}>★</span>
    ));
  };

  return productData ? (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
      {/* --------------- Product Data --------------- */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
        {/* ----------- Product Images ------------- */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
            {(Array.isArray(productData.image) ? productData.image : [productData.image]).map((item, index) => (
              <img
                onClick={() => setImage(item)}
                src={item}
                key={index}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt=""
              />
            ))}
          </div>
          <div className="w-full sm:w-[80%]">
            <img className="w-full h-auto" src={image} alt="" />
          </div>
        </div>
        {/* ------------ Product Info -------------- */}
        <div className="flex-1">
          <h1 className="font-medium text-2xl mt-2">{productData.name}</h1>
          <div className="flex items-center gap-1 mt-2">
            {renderStars(avgRating)}
            <p className="pl-2 text-sm text-gray-500">({reviewCount})</p>
          </div>
          <p className="mt-5 text-3xl font-medium">
            {currency}
            {productData.price}
          </p>
          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>
          {sizeOptions.length > 0 && (
            <div className="flex flex-col gap-4 my-8">
              <p>Select Size</p>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((sizeLabel) => (
                  <button
                    type="button"
                    onClick={() => setSize(sizeLabel)}
                    className={`border py-2 px-4 bg-gray-100 ${sizeLabel === size ? "border-orange-500" : ""}`}
                    key={sizeLabel}
                  >
                    {sizeLabel}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={() => addToCart(productData._id, sizeOptions.length > 0 ? size : "One Size")}
            className="bg-black text-white px-8 py-3 my-2 text-sm active:bg-gray-700"
          >
            ADD TO CART
          </button>
          <hr className="mt-8 sm:w-4/5" />
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
            <p>100% Original product</p>
            <p>Cash on delivery is available on this product.</p>
            <p>Easy return and exchange policy within 7 days.</p>
          </div>
        </div>
      </div>

      {/* ------ Description and Reviews Tabs ------ */}
      <div className="mt-20">
        <div className="flex">
          <button
            onClick={() => setActiveTab("description")}
            className={`border px-5 py-3 text-sm font-medium cursor-pointer ${activeTab === "description" ? "bg-gray-100 border-b-white" : ""}`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`border px-5 py-3 text-sm font-medium cursor-pointer ${activeTab === "reviews" ? "bg-gray-100 border-b-white" : ""}`}
          >
            Reviews ({reviewCount})
          </button>
        </div>
        <div className="border px-6 py-6">
          {activeTab === "description" ? (
            <div className="text-sm text-gray-500">
              <p>{productData.description}</p>
            </div>
          ) : (
            <div>
              <ReviewSection productId={productData._id} />
              <ReviewSummary productId={productData._id} reviewCount={reviewCount} />
            </div>
          )}
        </div>
      </div>

      {/* ---------- Display related products---------- */}
      <RelatedProducts
        category={productData.category}
        subCategory={productData.subCategory}
        productId={productData._id}        audience={productData.specifications?.Audience}

      />
    </div>
  ) : (
    <div className="opacity-0"></div>
  );
};

export default Product;
