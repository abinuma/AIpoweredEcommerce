import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";

const Sidebar = () => {
  return (
    <div className="w-[18%] min-h-screen border-r-2">
      <div className="flex flex-col gap-4 pt-6 pl-[20%] text-[15px]">
        <NavLink
className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1 transition-colors ${isActive ? "bg-[rgb(212,157,174)]" : "bg-white"
            }`
          }          to="/seller/add"
        >
          <img className="w-5 h-5" src={assets.add_icon} alt="" />
          <p className="hidden md:block">Add Item</p>
        </NavLink>
        <NavLink
className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1 transition-colors ${isActive ? "bg-[rgb(212,157,174)]" : "bg-white"
            }`
          }          to="/seller/list"
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="" />
          <p className="hidden md:block">List Items</p>
        </NavLink>
        <NavLink
className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-1 transition-colors ${isActive ? "bg-[rgb(212,157,174)]" : "bg-white"
            }`
          }          to="/seller/orders"
        >
          <img className="w-5 h-5" src={assets.order_box_icon} alt="" />
          <p className="hidden md:block">Orders</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
