import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";

const Cart = () => {
  const {
    products,
    currency,
    cartItems,
    updateQuantity,
    navigate,
    showSearch,
    search,
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);
  const [filteredCart, setFilteredCart] = useState([]);

  useEffect(() => {
    if (products.length > 0) {
      const tempData = [];

      for (const items in cartItems) {
        for (const item in cartItems[items]) {
          if (cartItems[items][item] > 0) {
            tempData.push({
              _id: items,
              size: item,
              quantity: cartItems[items][item],
            });
          }
        }
      }

      let filtered = tempData;

      if (showSearch && search) {
        filtered = tempData.filter((cartItem) => {
          const productData = products.find(
            (p) => p._id === cartItem._id
          );
          if (!productData) return false;

          const priceString = productData.price.toString();

          return (
            productData.name
              .toLowerCase()
              .includes(search.toLowerCase()) ||
            priceString.includes(search)
          );
        });
      }

      setCartData(tempData);
      setFilteredCart(filtered);
    }
  }, [cartItems, products, search, showSearch]);

  const displayData =
    showSearch && search ? filteredCart : cartData;

  return (
    <div className="border-t pt-14">
      {/* Title */}
      <div className="text-2xl mb-3">
        {showSearch && search ? (
          <Title text1={"SEARCH"} text2={"RESULTS"} />
        ) : (
          <Title text1={"YOUR"} text2={"CART"} />
        )}
      </div>

      {/* Cart Items */}
      <div>
        {displayData.length > 0 ? (
          displayData.map((item, index) => {
            const productData = products.find(
              (product) => product._id === item._id
            );

            if (!productData) {
              updateQuantity(item._id, item.size, 0);
              return null;
            }

            return (
              <div
                key={index}
                className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
              >
                <div className="flex items-start gap-6">
                  <img
                    className="w-16 sm:w-20"
                    src={productData.image[0]}
                    alt=""
                  />
                  <div>
                    <p className="text-xs sm:text-lg font-medium">
                      {productData.name}
                    </p>
                    <div className="flex items-center gap-5 mt-2">
                      <p>
                        {currency}
                        {productData.price}
                      </p>
                      <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50">
                        {item.size}
                      </p>
                    </div>
                  </div>
                </div>

                <input
                  onChange={(e) =>
                    e.target.value === "" ||
                    e.target.value === "0"
                      ? null
                      : updateQuantity(
                          item._id,
                          item.size,
                          Number(e.target.value)
                        )
                  }
                  className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
                  type="number"
                  min={1}
                  defaultValue={item.quantity}
                />

                <img
                  onClick={() =>
                    updateQuantity(item._id, item.size, 0)
                  }
                  className="w-4 sm:w-5 cursor-pointer"
                  src={assets.bin_icon}
                  alt=""
                />
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-500 py-10">
            No products found
          </p>
        )}
      </div>

      {/* 🔥 RESTORED CHECKOUT SECTION 🔥 */}
      {cartData.length > 0 && (
        <div className="flex justify-end my-20">
          <div className="w-full sm:w-[450px]">
            <CartTotal />

            <div className="w-full text-end">
              <button
                onClick={() => navigate("/place-order")}
                className="bg-black text-white text-sm my-8 py-3 px-8"
              >
                PROCEED TO CHECKOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;