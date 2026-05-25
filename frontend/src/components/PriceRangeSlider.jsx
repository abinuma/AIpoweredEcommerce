import { useEffect, useState } from "react";

const PriceRangeSlider = ({ min, max, value, onChange, currency = "$" }) => {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    setLocal(value);
  }, [value.min, value.max, min, max]);

  if (max <= min) return null;

  const handleMin = (e) => {
    const nextMin = Math.min(Number(e.target.value), local.max - 1);
    const updated = { min: nextMin, max: local.max };
    setLocal(updated);
    onChange(updated);
  };

  const handleMax = (e) => {
    const nextMax = Math.max(Number(e.target.value), local.min + 1);
    const updated = { min: local.min, max: nextMax };
    setLocal(updated);
    onChange(updated);
  };

  const minPercent = ((local.min - min) / (max - min)) * 100;
  const maxPercent = ((local.max - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-800">
          {currency}
          {local.min}
        </span>
        <span className="font-medium text-gray-800">
          {currency}
          {local.max}
        </span>
      </div>
      <div className="relative h-2">
        <div className="absolute inset-0 rounded-full bg-gray-200" />
        <div
          className="absolute h-2 rounded-full bg-gray-800"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={local.min}
          onChange={handleMin}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-800 [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <input
          type="range"
          min={min}
          max={max}
          value={local.max}
          onChange={handleMax}
          className="absolute w-full h-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-gray-800 [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );
};

export default PriceRangeSlider;
