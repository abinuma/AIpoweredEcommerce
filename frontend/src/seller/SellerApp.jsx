import React, { useContext, useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route, useNavigate } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import ShopProfile from "./pages/ShopProfile";
import SellerRequests from "./pages/SellerRequests";
import { ShopContext } from "../context/ShopContext";

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = "$";

const SellerApp = () => {
  const { token, role, setToken } = useContext(ShopContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("token") || localStorage.getItem("role") !== 'seller') {
      navigate('/login');
    }
  }, [token, role, navigate]);

  if (!token || role !== 'seller') {
    return null;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar setToken={setToken} />
      <hr />
      <div className="flex w-full">
        <Sidebar />
        <div className=" w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base">
          <Routes>
            <Route path="add" element={<Add token={token} />} />
            <Route path="list" element={<List token={token} />} />
            <Route path="orders" element={<Orders token={token} />} />
            <Route path="shop" element={<ShopProfile token={token} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default SellerApp;
