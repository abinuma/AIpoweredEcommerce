import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import ProductItem from "../components/ProductItem";
import Title from "../components/Title";

const Home = () => {
  const { products, search, showSearch } = useContext(ShopContext);
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
  if (showSearch && search) {
    const filtered = products.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.price.toString().includes(search) // <-- price search
    );
    setFilteredProducts(filtered);
  } else {
    setFilteredProducts([]);
  }
}, [search, showSearch, products]);

  return (
    <div>
      {/* If Searching → Show Search Results */}
      {showSearch && search ? (
        <div className="px-4 sm:px-6 pt-10">
          <div className="text-center py-6 text-3xl">
            <Title text1={"SEARCH"} text2={"RESULTS"} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((item, index) => (
                <ProductItem
                  key={index}
                  id={item._id}
                  image={item.image}
                  name={item.name}
                  price={item.price}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                No products found
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
          <Hero />
          <LatestCollection />
          <BestSeller />
          <OurPolicy />
          <NewsletterBox />
        </>
      )}
    </div>
  );
};

export default Home;
