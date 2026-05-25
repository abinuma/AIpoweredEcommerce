import { ChevronDown } from "lucide-react";

const CollapsibleSection = ({
  title,
  open,
  onToggle,
  children,
  badge,
  className = "",
}) => (
  <div className={`border-b border-gray-100 last:border-0 ${className}`}>
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between py-3.5 text-left group"
    >
      <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide group-hover:text-gray-900 transition-colors">
        {title}
      </span>
      <span className="flex items-center gap-2">
        {badge > 0 && (
          <span className="text-[10px] font-semibold bg-gray-800 text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {badge}
          </span>
        )}
        <ChevronDown
          size={16}
          className={`text-gray-500 transition-transform duration-300 ease-out ${
            open ? "rotate-180" : ""
          }`}
        />
      </span>
    </button>
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`}
    >
      <div className="overflow-hidden">
        <div className="pb-4 pt-0.5">{children}</div>
      </div>
    </div>
  </div>
);

export default CollapsibleSection;
