import React, { useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Add = ({token}) => {
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Men");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [bestseller, setBestseller] = useState(false);
  const [sizes, setSizes] = useState([]);

  const [aiGenerating, setAiGenerating] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState("");

  const generateDescription = async () => {
    if (!name.trim()) { toast.error("Enter a product name first"); return; }
    setAiGenerating(true);
    try {
      const res = await axios.post(backendUrl + '/api/description/generate', 
        { name, category, subCategory, sizes, price },
        { headers: { authorization: token } }
      );
      if (res.data.success) { setDescription(res.data.description); setShowRegen(true); }
      else toast.error(res.data.message);
    } catch (e) { toast.error(e.message); }
    setAiGenerating(false);
  };

  const regenerateDescription = async () => {
    if (!regenInstruction.trim()) return;
    setAiGenerating(true);
    try {
      const res = await axios.post(backendUrl + '/api/description/regenerate', 
        { name, category, currentDescription: description, instruction: regenInstruction },
        { headers: { authorization: token } }
      );
      if (res.data.success) { setDescription(res.data.description); setRegenInstruction(""); }
      else toast.error(res.data.message);
    } catch (e) { toast.error(e.message); }
    setAiGenerating(false);
  };

  const onSubmitHandler =async (e) =>{
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name',name);
      formData.append('description',description);
      formData.append('price',price);
      formData.append('category',category);
      formData.append('subCategory',subCategory);
      formData.append('bestseller',bestseller);
      formData.append('sizes',JSON.stringify(sizes));

      image1 && formData.append('image1',image1);
      image2 && formData.append('image2',image2);
      image3 && formData.append('image3',image3);
      image4 && formData.append('image4',image4);

      const response = await axios.post(backendUrl + '/api/product/add', formData,{
    headers: {
      authorization: token
    }
  }); 
        
      if (response.data.success) {
        toast.success(response.data.message)
        setName("");
        setDescription("");
        setPrice("");
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
      } else{
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    }
  }

  return (
    <form onSubmit={onSubmitHandler}  className="flex flex-col w-full items-start gap-3">
      <div>
        <p className="mb-2">Upload Image</p>

        <div className="flex gap-2">
          <label htmlFor="image1">
            <img
              className="w-20 cursor-pointer"
              src={!image1 ? assets.upload_area : URL.createObjectURL(image1)}
              alt=""
            />
            <input
              onChange={(e) => setImage1(e.target.files[0])}
              type="file"
              id="image1"
              hidden
            />
          </label>
          <label htmlFor="image2">
            <img
              className="w-20 cursor-pointer"
              src={!image2 ? assets.upload_area : URL.createObjectURL(image2)}
              alt=""
            />
            <input
              onChange={(e) => setImage2(e.target.files[0])}
              type="file"
              id="image2"
              hidden
            />
          </label>
          <label htmlFor="image3">
            <img
              className="w-20 cursor-pointer"
              src={!image3 ? assets.upload_area : URL.createObjectURL(image3)}
              alt=""
            />
            <input
              onChange={(e) => setImage3(e.target.files[0])}
              type="file"
              id="image3"
              hidden
            />
          </label>
          <label htmlFor="image4">
            <img
              className="w-20 cursor-pointer"
              src={!image4 ? assets.upload_area : URL.createObjectURL(image4)}
              alt=""
            />
            <input
              onChange={(e) => setImage4(e.target.files[0])}
              type="file"
              id="image4"
              hidden
            />
          </label>
        </div>
      </div>
      <div className="w-full">
        <p className="mb-2">Product name</p>
        <input
          onChange={(e) => setName(e.target.value)}
          value={name}
          className="w-full max-w-125 px-3 py-2"
          type="text"
          placeholder="Type here"
          required
        />
      </div>
      <div className="w-full">
        <div className="flex items-center justify-between mb-2 max-w-125">
          <p>Product description</p>
          <button 
            type="button" 
            onClick={generateDescription}
            disabled={aiGenerating || !name.trim()}
            className="text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-3 py-1 rounded shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {aiGenerating && !showRegen ? "Generating..." : "✨ Generate with AI"}
          </button>
        </div>
        <textarea
          className="w-full max-w-125 px-3 py-2 border border-gray-300 rounded"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write content here"
          required
          rows={4}
        />
        {showRegen && (
          <div className="flex items-center gap-2 mt-2 max-w-125">
            <input 
              type="text" 
              value={regenInstruction} 
              onChange={e => setRegenInstruction(e.target.value)} 
              placeholder="e.g. Make it shorter, Focus on durability" 
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded"
            />
            <button 
              type="button" 
              onClick={regenerateDescription}
              disabled={aiGenerating || !regenInstruction.trim()}
              className="text-xs bg-gray-800 text-white px-3 py-2 rounded hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiGenerating ? "..." : "🔄 Regenerate"}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 w-full sm:gap-8">
        <div>
          <p className="mb-2">Product category</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            className="w-full px-3 py-2"
          >
            <option value="Men">Men</option>
            <option value="Women">Women</option>
            <option value="Kids">Kids</option>
          </select>
        </div>
        <div>
          <p className="mb-2">Sub category</p>
          <select
            onChange={(e) => setSubCategory(e.target.value)}
            value={subCategory}
            className="w-full px-3 py-2"
          >
            <option value="Topwear">Topwear</option>
            <option value="Bottomwear">Bottomwear</option>
            <option value="Winterwear">Winterwear</option>
          </select>
        </div>
        <div>
          <p className="mb-2">Product price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-3 py-2 sm:w-30"
            type="number"
            placeholder="25"
          />
        </div>
      </div>

      <div>
        <p className="mb-2">Product sizes</p>
        <div className="flex gap-3 flex-wrap">
          <div
            onClick={() =>
              setSizes((prev) =>
                prev.includes("S")
                  ? prev.filter((item) => item !== "S")
                  : [...prev, "S"],
              )
            }
          >
            <p className={`${sizes.includes("S") ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>S</p>
          </div>
          <div
            onClick={() =>
              setSizes((prev) =>
                prev.includes("M")
                  ? prev.filter((item) => item !== "M")
                  : [...prev, "M"],
              )
            }
          >
            <p  className={`${sizes.includes("M") ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>M</p>
          </div>
          <div
            onClick={() =>
              setSizes((prev) =>
                prev.includes("L")
                  ? prev.filter((item) => item !== "L")
                  : [...prev, "L"],
              )
            }
          >
            <p className={`${sizes.includes("L") ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>L</p>
          </div>
          <div
            onClick={() =>
              setSizes((prev) =>
                prev.includes("XL")
                  ? prev.filter((item) => item !== "XL")
                  : [...prev, "XL"],
              )
            }
          >
            <p className={`${sizes.includes("XL") ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>XL</p>
          </div>
          <div
            onClick={() =>
              setSizes((prev) =>
                prev.includes("XXL")
                  ? prev.filter((item) => item !== "XXL")
                  : [...prev, "XXL"],
              )
            }
          >
            <p className={`${sizes.includes("XXL") ? 'bg-pink-100' : 'bg-slate-200'} px-3 py-1 cursor-pointer`}>XXL</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <input onChange={()=>setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id="bestseller" />
        <label className="cursor-pointer" htmlFor="bestseller">
          Add to bestseller
        </label>
      </div>
      <button
        className="w-28 py-3 bg-black text-white cursor-pointer"
        type="submit"
      >
        ADD
      </button>
    </form>
  );
};

export default Add;
