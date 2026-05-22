export const specificationsConfig = {
  Clothing: {
    subcategories: ["Topwear", "Bottomwear", "Winterwear"],
    availableSizes: ["S", "M", "L", "XL", "XXL"],
    fields: [] // Handled using existing sizes
  },
  Shoes: {
    subcategories: ["Sneakers", "Boots", "Sandals", "Formal"],
    availableSizes: ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
    fields: [
      { name: "brand", label: "Brand", type: "text", required: true },
      { name: "gender", label: "Gender", type: "select", options: ["Men", "Women", "Kids"], required: true },
      { name: "material", label: "Material", type: "text", required: false },
      { name: "soleType", label: "Sole Type", type: "text", required: false },
      { name: "color", label: "Color", type: "text", required: true },
      { name: "style", label: "Style", type: "text", required: false },
    ]
  },
  Electronics: {
    subcategories: ["Smartphones", "Headphones/Earphones", "Chargers"],
    fieldsBySubcategory: {
      Smartphones: [
        { name: "ram", label: "RAM", type: "text", required: true },
        { name: "storage", label: "Storage", type: "text", required: true },
        { name: "battery", label: "Battery", type: "text", required: true },
        { name: "processor", label: "Processor", type: "text", required: true },
        { name: "connectivity", label: "Connectivity", type: "text", required: false },
        { name: "warranty", label: "Warranty", type: "text", required: false },
        { name: "brand", label: "Brand", type: "text", required: true },
      ],
      "Headphones/Earphones": [
        { name: "connectivity", label: "Connectivity", type: "text", required: true },
        { name: "noiseCancellation", label: "Noise Cancellation", type: "select", options: ["Yes", "No"], required: true },
        { name: "batteryLife", label: "Battery Life", type: "text", required: false },
        { name: "driverSize", label: "Driver Size", type: "text", required: false },
        { name: "brand", label: "Brand", type: "text", required: true },
      ],
      Chargers: [
        { name: "wattage", label: "Wattage", type: "text", required: true },
        { name: "portType", label: "Port Type", type: "text", required: true },
        { name: "fastChargingSupport", label: "Fast Charging Support", type: "select", options: ["Yes", "No"], required: true },
        { name: "brand", label: "Brand", type: "text", required: true },
      ]
    }
  },
  Beauty: {
    subcategories: ["Skincare", "Makeup", "Fragrance"],
    fields: [
      { name: "skinType", label: "Skin Type", type: "text", required: true },
      { name: "ingredients", label: "Ingredients", type: "text", required: true },
      { name: "expiryDate", label: "Expiry Date", type: "date", required: true },
      { name: "brand", label: "Brand", type: "text", required: true },
    ]
  }
};
