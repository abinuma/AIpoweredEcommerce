import React, { useContext, useEffect, useMemo, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import {
  ChevronLeft,
  ChevronRight
} from "lucide-react";
const categories = ["Clothing", "Shoes", "Electronics", "Beauty"];

const Hero = () => {
  const { products } = useContext(ShopContext);
  const [index, setIndex] = useState(0);
  const { navigate } = useContext(ShopContext);

  // pick 2 random products per category
  const slides = useMemo(() => {
    if (!products?.length) return [];

    const STORAGE_KEY = "heroSlides";
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

    // check saved slides
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved);

      // if still valid use saved products
      if (Date.now() - parsed.timestamp < THREE_DAYS) {
        return parsed.slides;
      }
    }

    // otherwise generate new random products
    const newSlides = categories.map((cat) => {
      const filtered = products.filter((p) => p.category === cat);

      const shuffled = [...filtered].sort(() => 0.5 - Math.random());

      return {
        category: cat,
        products: shuffled.slice(0, 2),
      };
    });

    // save them
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        slides: newSlides,
      })
    );

    return newSlides;
  }, [products]);

  const next = () => {
    setIndex((prev) => (prev + 1) % slides.length);
  };

  const prev = () => {
    setIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // auto slide
  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(id);
  }, [slides.length]);

  const current = slides[index];

  if (!current) return null;

  const [left, right] = current.products;

  return (
    <>
      {/* Hide hero below tablet screens */}
      <div className="hidden md:flex px-6 lg:px-24 gap-4 lg:gap-6 relative w-full h-[420px] lg:h-[500px] overflow-hidden bg-gray-50 border border-gray-200 rounded-xl items-center justify-center">
  
        {/* LEFT IMAGE */}
        {left && (
          <div
            onClick={() => navigate(`/product/${left._id}`)}
            className="
              w-[24%] lg:w-[22%]
              h-[190px] lg:h-[240px]
              bg-white rounded-xl shadow-md overflow-hidden
              flex items-center justify-center
              self-start mt-6 lg:mt-8
              cursor-pointer hover:shadow-xl transition
              shrink-0
            "
          >
            <img
              src={left.image?.[0]}
              alt={left.name}
              className="w-full h-full object-contain p-3 lg:p-4 hover:scale-105 transition"
            />
          </div>
        )}
  
        {/* CENTER TEXT */}
        <div className="px-4 lg:px-10 text-center shrink-0">
          <p className="text-[10px] lg:text-xs tracking-widest text-gray-500 uppercase">
            Trending products in
          </p>
  
          <h1 className="text-2xl lg:text-4xl font-bold text-gray-900 mt-2 whitespace-nowrap">
            {current.category}
          </h1>
        </div>
  
        {/* RIGHT IMAGE */}
        {right && (
          <div
            onClick={() => navigate(`/product/${right._id}`)}
            className="
              w-[40%] lg:w-[38%]
              h-[320px] lg:h-[420px]
              bg-white rounded-xl shadow-lg overflow-hidden
              flex items-center justify-center
              cursor-pointer hover:shadow-2xl transition
              shrink-0
            "
          >
            <img
              src={right.image?.[0]}
              alt={right.name}
              className="w-full h-full object-contain p-4 lg:p-6 hover:scale-105 transition"
            />
          </div>
        )}
  
        {/* LEFT NAV */}
        <button
          onClick={prev}
          className="absolute left-3 lg:left-5 z-20 w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition"
        >
          <ChevronLeft size={24} className="lg:w-7 lg:h-7" />
        </button>
  
        {/* RIGHT NAV */}
        <button
          onClick={next}
          className="absolute right-3 lg:right-5 z-20 w-10 h-10 lg:w-14 lg:h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition"
        >
          <ChevronRight size={24} className="lg:w-7 lg:h-7" />
        </button>
      </div>
    </>
  );
};

export default Hero;
