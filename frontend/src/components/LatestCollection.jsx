import React, { useContext, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProductItem from "./ProductItem";
import { pickHomepageLatest } from "../utils/productDistribution";

const LatestCollection = () => {
  const { products } = useContext(ShopContext);

  const latestProducts = useMemo(
    () => pickHomepageLatest(products, 4),
    [products],
  );

  return (
    <div className="my-10">
      <div className="text-center py-8 text-3xl">
        <Title text1={"LATEST"} text2={"COLLECTIONS"} />
        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Discover top-rated picks from every category — balanced across Clothing, Shoes, Electronics, and Beauty.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 gap-y-6">
        {latestProducts.map((item) => (
          <ProductItem
            key={item._id}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
          />
        ))}
      </div>
    </div>
  );
};

export default LatestCollection;
