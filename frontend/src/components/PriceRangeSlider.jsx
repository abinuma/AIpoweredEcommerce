import { useId } from "react";

const PriceRangeSlider = ({ min, max, value, onChange, currency = "$" }) => {
  const id = useId();
  const range = max - min;
  const gap = range <= 1 ? 1 : Math.max(1, Math.floor(range * 0.02));

  if (max <= min) return null;

  const safeMin = Math.min(value.min, value.max - gap);
  const safeMax = Math.max(value.max, value.min + gap);
  const minPercent = ((safeMin - min) / range) * 100;
  const maxPercent = ((safeMax - min) / range) * 100;
  const minOnTop = safeMin > min + range * 0.5;

  const handleMin = (e) => {
    const next = Math.min(Number(e.target.value), safeMax - gap);
    onChange({ min: next, max: safeMax });
  };

  const handleMax = (e) => {
    const next = Math.max(Number(e.target.value), safeMin + gap);
    onChange({ min: safeMin, max: next });
  };

  return (
    <div className="space-y-4">
      <style>{`
        .${id}-range {
          position: absolute;
          width: 100%;
          height: 28px;
          margin: 0;
          padding: 0;
          background: transparent;
          pointer-events: none;
          -webkit-appearance: none;
          appearance: none;
        }
        .${id}-range::-webkit-slider-runnable-track {
          height: 6px;
          background: transparent;
          border: none;
        }
        .${id}-range::-moz-range-track {
          height: 6px;
          background: transparent;
          border: none;
        }
        .${id}-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          pointer-events: auto;
          margin-top: -6px;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #1f2937;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          cursor: grab;
        }
        .${id}-range:active::-webkit-slider-thumb {
          cursor: grabbing;
          transform: scale(1.08);
        }
        .${id}-range::-moz-range-thumb {
          pointer-events: auto;
          height: 18px;
          width: 18px;
          border-radius: 9999px;
          background: white;
          border: 2px solid #1f2937;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
          cursor: grab;
        }
      `}</style>

      <div className="flex items-center justify-between text-sm tabular-nums">
        <span className="font-medium text-gray-800">
          {currency}
          {safeMin}
        </span>
        <span className="text-gray-400">—</span>
        <span className="font-medium text-gray-800">
          {currency}
          {safeMax}
        </span>
      </div>

      <div className="relative h-7 px-0.5">
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-200" />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-gray-800 transition-[left,width] duration-75"
          style={{
            left: `${minPercent}%`,
            width: `${Math.max(0, maxPercent - minPercent)}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={safeMin}
          onChange={handleMin}
          className={`${id}-range`}
          style={{ zIndex: minOnTop ? 5 : 3 }}
          aria-label="Minimum price"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={safeMax}
          onChange={handleMax}
          className={`${id}-range`}
          style={{ zIndex: minOnTop ? 3 : 5 }}
          aria-label="Maximum price"
        />
      </div>
    </div>
  );
};

export default PriceRangeSlider;
