import React, { useState, useRef, useEffect } from "react";

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder,
  icon,
  label,
  disabled = false,
  type = "primary",
}: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  icon?: React.ReactNode;
  label?: string;
  disabled?: boolean;
  type?: "primary" | "secondary";
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  if (type === "secondary") {
    return (
      <div
        className={`relative ${isOpen ? "z-[101]" : "z-10"}`}
        ref={dropdownRef}
      >
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center gap-1 cursor-pointer group ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <span className="text-white text-sm font-bold group-hover:text-secondary transition-colors">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-secondary transition-colors">
            {isOpen ? "expand_less" : "expand_more"}
          </span>
        </div>

        {isOpen && !disabled && (
          <div className="absolute top-full left-0 mt-2 w-48 bg-[#0d151c]/95 backdrop-blur-3xl border border-white/10 rounded-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[100] max-h-[420px] overflow-y-auto overscroll-contain custom-scrollbar py-1">
            <div
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === "" ? "bg-[#ffad3a]/10 text-[#ffad3a] font-bold" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
            >
              {placeholder}
            </div>
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt.value ? "bg-[#ffad3a]/10 text-[#ffad3a] font-bold" : "text-slate-300 hover:text-white hover:bg-white/5"}`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex-1 relative bg-transparent rounded-[10px] transition-all group min-h-[80px] border ${isOpen ? "border-secondary/50 z-[101] shadow-[0_0_20px_rgba(254,191,13,0.1)]" : "border-white/10 z-10 hover:border-secondary/30"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      ref={dropdownRef}
    >
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (!disabled) setIsOpen(!isOpen);
          }
        }}
        className={`w-full h-full cursor-pointer flex items-center p-4 pl-6 gap-4`}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label || placeholder}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Text Setup */}
        <div className="flex-1 flex flex-col justify-center pr-2 truncate">
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 mb-0.5">
            {label}
          </span>
          <span
            className={`font-headline text-lg italic uppercase font-black tracking-tighter truncate transition-colors ${
              value !== "" || isOpen
                ? "text-secondary"
                : "text-white/80 group-hover:text-white"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        {/* Circular Icon (Matching Top Categories) on the Right */}
        <div className="relative flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center flex-shrink-0">
            {/* Inner Circle */}
            <div
              className={`absolute inset-0 rounded-full border transition-all duration-700 ${
                isOpen
                  ? "border-secondary/40 bg-secondary/10 shadow-[0_0_20px_rgba(254,191,13,0.2)]"
                  : "border-white/5 bg-transparent group-hover:border-secondary/20 group-hover:bg-secondary/5"
              }`}
            ></div>

            {/* Rotating Outer Ring when Active */}
            <div
              className={`absolute -inset-1 rounded-full border-t border-r border-transparent transition-all duration-[1s] ease-linear ${
                isOpen
                  ? "border-secondary opacity-100 animate-[spin_3s_linear_infinite]"
                  : "opacity-0 group-hover:opacity-40 border-secondary group-hover:animate-[spin_4s_linear_infinite]"
              }`}
            ></div>

            <div
              className={`relative z-10 transition-all duration-500 ${
                isOpen || value !== ""
                  ? "text-secondary scale-110"
                  : "text-slate-500 group-hover:text-secondary group-hover:scale-105"
              }`}
            >
              {icon}
            </div>
          </div>

          <div className="flex items-center justify-center">
            <span
              className={`material-symbols-outlined transition-transform duration-300 ${isOpen ? "rotate-180 text-secondary" : "text-slate-600 group-hover:text-white"}`}
            >
              expand_more
            </span>
          </div>
        </div>
      </div>

      {isOpen && !disabled && (
        <div
          className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#0F1923] border border-white/10 rounded-[10px] shadow-[0_20px_40px_rgba(0,0,0,0.5)] z-[100] max-h-[420px] overflow-y-auto overscroll-contain custom-scrollbar py-2"
          role="listbox"
        >
          <div
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`px-5 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${value === "" ? "bg-secondary/10 text-secondary font-bold border-l-2 border-secondary" : "text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent"}`}
            role="option"
            aria-selected={value === ""}
          >
            <span className="font-headline font-black italic uppercase tracking-tighter">
              {placeholder}
            </span>
          </div>
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              className={`px-5 py-3 text-sm cursor-pointer transition-colors flex items-center gap-2 ${value === opt.value ? "bg-secondary/10 text-secondary font-bold border-l-2 border-secondary" : "text-white/70 hover:bg-white/5 hover:text-white border-l-2 border-transparent"}`}
              role="option"
              aria-selected={value === opt.value}
            >
              <span className="font-bold">{opt.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
