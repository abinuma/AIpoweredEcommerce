import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { assets } from "../../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import { useContext } from "react";
import { ShopContext } from "../../context/ShopContext";
import { specificationsConfig } from "../../config/specifications";

const Add = ({ token }) => {
  const { backendUrl } = useContext(ShopContext)
  const [image1, setImage1] = useState(false);
  const [image2, setImage2] = useState(false);
  const [image3, setImage3] = useState(false);
  const [image4, setImage4] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Clothing");
  const [subCategory, setSubCategory] = useState("Topwear");
  const [keywords, setKeywords] = useState("");
  const [bestseller, setBestseller] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Sizes will store objects: { size: string, stock: number }
  const [sizes, setSizes] = useState([]);
  const [stockQuantity, setStockQuantity] = useState(""); // global stock for items without sizes
  const [specifications, setSpecifications] = useState({});
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [sizeDropdownStyle, setSizeDropdownStyle] = useState({});
  const dropdownRef = useRef(null);
  const sizePanelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const inTrigger = dropdownRef.current?.contains(event.target);
      const inPanel = sizePanelRef.current?.contains(event.target);
      if (!inTrigger && !inPanel) {
        setShowSizeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useLayoutEffect(() => {
    if (!showSizeDropdown || !dropdownRef.current) return;

    const updatePosition = () => {
      const rect = dropdownRef.current.getBoundingClientRect();
      const margin = 8;
      const preferredMax = 200;
      const spaceBelow = window.innerHeight - rect.bottom - margin;
      const spaceAbove = rect.top - margin;
      const openUp = spaceBelow < 140 && spaceAbove > spaceBelow;
      const available = openUp ? spaceAbove : spaceBelow;

      setSizeDropdownStyle({
        position: "fixed",
        left: rect.left,
        width: Math.max(rect.width, 80),
        zIndex: 60,
        maxHeight: Math.min(preferredMax, Math.max(96, available)),
        ...(openUp
          ? { bottom: window.innerHeight - rect.top + margin }
          : { top: rect.bottom + margin }),
      });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [showSizeDropdown]);

  const handleCategoryChange = (e) => {
    const newCat = e.target.value;
    setCategory(newCat);
    setSubCategory(specificationsConfig[newCat]?.subcategories[0] || "");
    setSpecifications({});
    setSizes([]);
    setStockQuantity("");
  };

  const handleSubCategoryChange = (e) => {
    setSubCategory(e.target.value);
    setSpecifications({});
  };

  const handleSpecChange = (name, value) => {
    setSpecifications(prev => ({ ...prev, [name]: value }));
  };

  const toggleSize = (sizeStr) => {
    setSizes(prev => {
      if (prev.some(s => s.size === sizeStr)) {
        return prev.filter(s => s.size !== sizeStr);
      } else {
        return [...prev, { size: sizeStr, stock: 0 }];
      }
    });
  };

  const updateSizeStock = (sizeStr, newStock) => {
    setSizes(prev => prev.map(s => s.size === sizeStr ? { ...s, stock: Number(newStock) } : s));
  };

  const currentConfig = specificationsConfig[category] || {};
  const currentFields = currentConfig.fields || currentConfig.fieldsBySubcategory?.[subCategory] || [];
  const availableSizes = currentConfig.availableSizes || [];

  const [aiGenerating, setAiGenerating] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [regenInstruction, setRegenInstruction] = useState("");

  const validateProductForm = () => {
    if (!image1 && !image2 && !image3 && !image4) return "Upload at least one product image";
    if (!name.trim()) return "Product name is required";
    if (!description.trim()) return "Product description is required";
    if (!category.trim()) return "Product category is required";
    if (!subCategory.trim()) return "Product sub category is required";
    if (!String(price).trim()) return "Product price is required";
    if (Number(price) <= 0) return "Product price must be greater than 0";

    if (availableSizes.length > 0 && sizes.length === 0) return "Select at least one product size";

    for (const field of currentFields) {
      if (field.required && !specifications[field.name]) {
        return `${field.label} is required`;
      }
    }
    return "";
  };

  const generateDescription = async () => {
    if (!name.trim()) { toast.error("Enter a product name first"); return; }
    setAiGenerating(true);
    try {
      const res = await axios.post(backendUrl + '/api/description/generate',
        { name, category, subCategory, keywords },
        { headers: { authorization: token } }
      );
      if (res.data.success) { setDescription(res.data.description); setShowRegen(true); }
      else toast.error(res.data.message);
    } catch (e) { toast.error(e.response?.data?.message || e.message); }
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

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    const validationError = validateProductForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsAdding(true);
      const formData = new FormData();
      formData.append('name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category', category);
      formData.append('subCategory', subCategory);
      formData.append('bestseller', bestseller);
      formData.append('sizes', JSON.stringify(sizes));
      formData.append('stockQuantity', availableSizes.length > 0 ? "0" : stockQuantity);
      formData.append('specifications', JSON.stringify(specifications));

      image1 && formData.append('image1', image1);
      image2 && formData.append('image2', image2);
      image3 && formData.append('image3', image3);
      image4 && formData.append('image4', image4);

      const response = await axios.post(backendUrl + '/api/product/add', formData, {
        headers: { authorization: token }
      });

      if (response.data.success) {
        toast.success(response.data.message)
        setName("");
        setDescription("");
        setPrice("");
        setKeywords("");
        setImage1(false);
        setImage2(false);
        setImage3(false);
        setImage4(false);
        setSizes([]);
        setBestseller(false);
        setStockQuantity("");
        setSpecifications({});
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <form onSubmit={onSubmitHandler} className="flex flex-col w-full items-start gap-3">
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
              accept="image/*"
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
              accept="image/*"
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
              accept="image/*"
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
              accept="image/*"
              id="image4"
              hidden
            />
          </label>
        </div>
      </div>
      <div className="w-full">
        <p className="mb-2">AI keywords / product notes</p>
        <input
          onChange={(e) => setKeywords(e.target.value)}
          value={keywords}
          className="w-full max-w-125 px-3 py-2 border border-gray-300 rounded"
          type="text"
          placeholder="e.g. blue oversized cotton hoodie, soft fabric, streetwear"
        />
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
            onChange={handleCategoryChange}
            value={category}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            {Object.keys(specificationsConfig).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-2">Sub category</p>
          <select
            onChange={handleSubCategoryChange}
            value={subCategory}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          >
            {currentConfig?.subcategories?.map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-2">Product price</p>
          <input
            onChange={(e) => setPrice(e.target.value)}
            value={price}
            className="w-full px-3 py-2 sm:w-30 border border-gray-300 rounded"
            type="number"
            placeholder="25"
          />
        </div>

        {availableSizes.length === 0 && (
          <div>
            <p className="mb-2">Stock Quantity</p>
            <input
              onChange={(e) => setStockQuantity(e.target.value)}
              value={stockQuantity}
              className="w-full px-3 py-2 sm:w-30 border border-gray-300 rounded"
              type="number"
              placeholder="100"
            />
          </div>
        )}
      </div>

      {availableSizes.length > 0 && (
        <div className="w-full max-w-125 mt-2">
          <p className="mb-2">Product sizes</p>
          <div className="relative" ref={dropdownRef}>
            <div
              className="w-30 max-w-[125px] px-3 py-2 border border-gray-300 rounded cursor-pointer bg-white flex justify-between items-center"
              onClick={() => setShowSizeDropdown(!showSizeDropdown)}
            >
              {/* <span className="text-gray-700">Select Sizes ▼</span> */}

              <div className="flex justify-between items-center w-full">
                <span className="text-gray-700">Select sizes</span>
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${showSizeDropdown ? "rotate-180" : ""
                    }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {showSizeDropdown && (
              <div
                ref={sizePanelRef}
                className="w-30 max-w-[125px] bg-white border border-gray-200 rounded shadow-lg overflow-y-auto overscroll-contain"
                style={sizeDropdownStyle}
              >
                {availableSizes.map(sz => {
                  const isSelected = sizes.some(s => s.size === sz);
                  return (
                    <div
                      key={sz}
                      className={`px-4 py-2 cursor-pointer hover:bg-gray-50 flex items-center justify-between ${isSelected ? 'bg-blue-50' : ''}`}
                      onClick={() => toggleSize(sz)}
                    >
                      <span className={isSelected ? 'font-medium text-blue-600' : 'text-gray-700'}>
                        {sz}
                      </span>
                      {isSelected && <span className="text-blue-600">✓</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {sizes.length > 0 && (
            <div className="mt-4 flex flex-col gap-2 p-4 border rounded bg-gray-50">
              <p className="text-sm font-medium mb-1">Stock per selected size</p>
              {sizes.map(s => (
                <div key={s.size} className="flex items-center gap-3">
                  <span className="w-12 font-medium">{s.size}</span>
                  <span className="text-gray-500">→</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Stock</span>
                    <input
                      type="number"
                      min="0"
                      className="w-20 px-2 py-1 border rounded text-sm"
                      value={s.stock}
                      onChange={(e) => updateSizeStock(s.size, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {currentFields.length > 0 && (
        <div className="w-full border p-4 rounded bg-gray-50 mt-2 max-w-125">
          <p className="mb-4 font-medium">Dynamic Specifications</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentFields.map(field => (
              <div key={field.name}>
                <p className="mb-1 text-sm text-gray-700">{field.label} {field.required && <span className="text-red-500">*</span>}</p>
                {field.type === "select" ? (
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    value={specifications[field.name] || ""}
                    onChange={(e) => handleSpecChange(field.name, e.target.value)}
                  >
                    <option value="">Select...</option>
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    value={specifications[field.name] || ""}
                    onChange={(e) => handleSpecChange(field.name, e.target.value)}
                    placeholder={field.label}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-2">
        <input onChange={() => setBestseller(prev => !prev)} checked={bestseller} type="checkbox" id="bestseller" />
        <label className="cursor-pointer" htmlFor="bestseller">
          Add to bestseller
        </label>
      </div>
      <button
        className="px-8 py-3 bg-black text-white cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
        type="submit"
        disabled={isAdding}
      >
        {isAdding ? "Adding..." : "Add Product"}
      </button>
    </form>
  );
};

export default Add;
