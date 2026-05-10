import React from "react";
import logo from "../assets/logo.png";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const Navbar = ({ setToken }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate("/admin/list"); // navigate to home page
  };

  return (
    <div className="flex items-center py-5 px-[4%] justify-between">
      <img
        className="w-[max(15%,80px)] cursor-pointer"
        src={assets.logo}
        alt="Admin Panel Logo"
        onClick={handleLogoClick}
      />

      {/* <button
        onClick={() => {
          if (window.confirm("Are you sure you want to logout?")) {
            setToken("");
          }
        }}
        className="bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm cursor-pointer"
      >
        Logout
      </button> */}

         <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={() => navigate("/")}
          className="border border-gray-300 bg-white text-gray-700 px-4 py-2 sm:px-5 rounded-full text-xs sm:text-sm cursor-pointer hover:bg-gray-100"
        >
          Main Platform
        </button>
        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to logout?")) {
              localStorage.removeItem("token");
              localStorage.removeItem("role");
              setToken("");
              navigate("/login");
            }
          }}
          className="bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm cursor-pointer"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
