import React from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import NewsletterBox from "../components/NewsletterBox";
const About = () => {
  return (
    <div>
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1={"ABOUT"} text2={"US"} />
      </div>

      <div className="my-10 flex flex-col md:flex-row gap-16">
        <img
          className="w-full md:max-w-[450px]"
          src={assets.about_img}
          alt=""
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">
          <p>At Crown Wear, we believe style is a reflection of confidence and individuality. Our brand was created to bring modern, comfortable, and high-quality fashion to people who want to look good and feel even better every day.</p>
          <p>At Crown Wear, we focus on carefully selected designs, premium fabrics, and attention to detail to ensure every piece meets our standards. Whether you're shopping for everyday essentials or standout pieces, we aim to offer collections that combine comfort, trend, and durability.</p>
          <b className="text-gray-800">Our Mission</b>
          <p>Our mission at Crown Wear is to deliver stylish, affordable, and high-quality clothing that empowers people to express themselves with confidence while enjoying a smooth and satisfying shopping experience.</p>
        </div>
      </div>
      <div className="text-xl py-4">
        <Title text1={"WHY"} text2={"CHOOSE US"} />
      </div>
      <div className="flex flex-col md:flex-row text-sm mb-20 ">
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Quantity Assurance:</b>
          <p className="text-gray-600">We meticulosly select and vet each product to ensure it meets our stringent quality standards.</p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Convenience:</b>
          <p className="text-gray-600">With our user-friendly interface and hassle-free ordering process, shopping has never been easier.</p>
        </div>
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">
          <b>Exceptional Customer Service:</b>
          <p className="text-gray-600">Our team of dedicated professionals is here to assist you every step of the way, ensuring your satisfaction is our top priority.</p>
        </div>
      </div>
      <NewsletterBox />
    </div>
  );
};

export default About;
