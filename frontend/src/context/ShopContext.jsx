import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const currency = "$";
  const delivery_fee = 10;
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [products, setProducts] = useState([]);
  const [token, setToken] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  const addToCart = async (itemId, size) => {
    const product = products.find((p) => p._id === itemId);
    const hasSizes = Array.isArray(product?.sizes) && product.sizes.length > 0;
    if (hasSizes && !size) {
      toast.error("Select Product Size");
      return;
    }
    const cartSize = size || "One Size";

    let cartData = structuredClone(cartItems);

    if (cartData[itemId]) {
      if (cartData[itemId][cartSize]) {
        cartData[itemId][cartSize] += 1;
      } else {
        cartData[itemId][cartSize] = 1;
      }
    } else {
      cartData[itemId] = {};
      cartData[itemId][cartSize] = 1;
    }
    setCartItems(cartData);

    if (token) {
      try {
        await axios.post(
          backendUrl + "/api/cart/add",
          { itemId, size: cartSize },
          { headers: { Authorization: token } },
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const getCartCount = () => {
    let totalCount = 0;
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalCount += cartItems[items][item];
          }
        } catch (error) {}
      }
    }
    return totalCount;
  };

  const updateQuantity = async (itemId, size, quantity) => {
    let cartData = structuredClone(cartItems);

    cartData[itemId][size] = quantity;

    setCartItems(cartData);
    if (token) {
      try {
        await axios.patch(
          backendUrl + "/api/cart/update",
          { itemId, size, quantity },
          { headers: { Authorization: token } },
        );
      } catch (error) {
        console.log(error);
        toast.error(error.message);
      }
    }
  };

  const getCartAmount = () => {
    let totalAmount = 0;
    for (const items in cartItems) {
      let itemInfo = products.find((product) => product._id === items);
      for (const item in cartItems[items]) {
        try {
          if (cartItems[items][item] > 0) {
            totalAmount += itemInfo.price * cartItems[items][item];
          }
        } catch (error) {}
      }
    }
    return totalAmount;
  };

  const getProductsData = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");
      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const getUserCart = async (token) => {
    try {
      const response = await axios.get(backendUrl + "/api/cart/get", {
        headers: { Authorization: token },
      });
      if (response.data.success) {
        setCartItems(response.data.cartData);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    getProductsData();
  }, []);

  const fetchProfile = async (currentToken) => {
    try {
      const response = await axios.get(backendUrl + "/api/user/profile", {
        headers: { Authorization: currentToken }
      });
      if (response.data.success && response.data.user) {
        setRole(response.data.user.role);
        localStorage.setItem("role", response.data.user.role);
      }
    } catch (error) {
      console.log("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("token")) {
      const currentToken = localStorage.getItem("token");
      setToken(currentToken);
      setRole(localStorage.getItem("role") || "");
      getUserCart(currentToken);
      fetchProfile(currentToken);
    }
  }, []);

  const value = {
    products,
    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    addToCart,
    getCartCount,
    updateQuantity,
    getCartAmount,
    navigate,
    backendUrl,
    setToken,
    token,
    role,
    setRole,
    setCartItems,
  };

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};
export default ShopContextProvider;
