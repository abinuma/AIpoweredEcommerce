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
    <div className="px-24 gap-6 relative w-full h-[500px] overflow-hidden bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center">
      {/* LEFT IMAGE */}
      {left && (
        <div
          onClick={() => navigate(`/product/${left._id}`)}
          className="w-[22%] h-[240px] bg-white rounded-xl shadow-md overflow-hidden flex items-center justify-center self-start mt-8 cursor-pointer hover:shadow-xl transition"
        >
          <img
            src={left.image?.[0]}
            alt={left.name}
            className="w-full h-full object-contain p-4 hover:scale-105 transition"
          />
        </div>
      )}

      {/* CENTER TEXT */}
      <div className="px-10 text-center">
        <p className="text-xs tracking-widest text-gray-500 uppercase">
          Trending products in
        </p>

        <h1 className="text-4xl font-bold text-gray-900 mt-2">
          {current.category}
        </h1>


      </div>

      {/* RIGHT IMAGE */}
      {right && (
        <div
          onClick={() => navigate(`/product/${right._id}`)}
          className="w-[38%] h-[420px] bg-white rounded-xl shadow-lg overflow-hidden flex items-center justify-center cursor-pointer hover:shadow-2xl transition"
        >
          <img
            src={right.image?.[0]}
            alt={right.name}
            className="w-full h-full object-contain p-6 hover:scale-105 transition"
          />
        </div>
      )}

      {/* NAV BUTTONS */}
       <button
          onClick={prev}
          className="absolute left-5 z-20 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition"
        >
          <ChevronLeft size={28} />
        </button>

        {/* RIGHT NAV */}
        <button
          onClick={next}
          className="absolute right-5 z-20 w-14 h-14 rounded-full bg-white shadow-lg flex items-center justify-center hover:scale-105 transition"
        >
          <ChevronRight size={28} />
        </button>
    </div>
  );
};

export default Hero;
