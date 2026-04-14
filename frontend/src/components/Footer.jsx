import React from "react";
import { assets } from "../assets/assets";
import { Link, Navigate, useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">
        <div>
          <img src={assets.logo} className="  mb-5 w-[max(25%,80px)] cursor-pointer" onClick={()=>navigate('/')} alt="" />
          <p className="w-full md:w-2/3 text-gray-600">
            Stay in the loop with Crownwear. Get exclusive access to new collections, private sales, style guides, and 20% off your first order.
          </p>
        </div>
        <div>
          <p className="text-xl font-medium mb-5">COMPANY</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <Link>Hiome</Link>
            <Link>About us</Link>
            <Link>Deliver</Link>
            <Link>Privacy policy</Link>
            
          </ul>
        </div>
        <div>
          <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
          <ul className="flex flex-col gap-1 text-gray-600">
            <li>+2519-028-82087 </li>
            <Link>contact@crownwear.com</Link>
          </ul>
        </div>
      </div>
      <div>
        <hr />
        <p className="py-5 text-sm text-center">
          Copyright {new Date().getFullYear()}@crownwear.com - All Right Reserved
        </p>
      </div>
    </div>
  );
};

export default Footer;
