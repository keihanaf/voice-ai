"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export default function CustomSelect({ label, options, value, onChange, placeholder = "انتخاب کنید" }) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex];
      if (item) item.scrollIntoView({ block: "nearest" });
    }
  }, [open, highlightIndex]);

  function handleKeyDown(e) {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        setHighlightIndex(0);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (highlightIndex >= 0) {
          onChange(options[highlightIndex].value);
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
    }
  }

  return (
    <div ref={containerRef} className="relative w-full" onKeyDown={handleKeyDown}>
      {label && (
        <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      )}

      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) setHighlightIndex(options.findIndex((o) => o.value === value));
        }}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-2.5
          bg-gray-800 text-white rounded-lg border transition-all duration-200
          ${open ? "border-blue-500 ring-1 ring-blue-500/30" : "border-gray-600 hover:border-gray-500"}
          focus:outline-none
        `}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selected?.icon && <selected.icon size={18} className="text-blue-400 shrink-0" />}
          <div className="text-right min-w-0">
            <span className="block truncate">{selected?.label || placeholder}</span>
            {selected?.description && (
              <span className="block text-xs text-gray-400 truncate">{selected.description}</span>
            )}
          </div>
        </div>
        <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute z-50 w-full mt-1.5 bg-gray-800 border border-gray-600 rounded-lg shadow-xl shadow-black/40 overflow-hidden"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isHighlighted = index === highlightIndex;
            const Icon = option.icon;

            return (
              <div
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setHighlightIndex(index)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors duration-100
                  ${isHighlighted ? "bg-gray-700" : ""}
                  ${isSelected ? "bg-blue-600/20" : ""}
                `}
              >
                {Icon && <Icon size={18} className={`shrink-0 ${isSelected ? "text-blue-400" : "text-gray-400"}`} />}
                <div className="flex-1 min-w-0 text-right">
                  <span className={`block truncate ${isSelected ? "text-blue-400 font-medium" : "text-white"}`}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="block text-xs text-gray-400 truncate">{option.description}</span>
                  )}
                </div>
                {isSelected && (
                  <Check size={16} className="text-blue-400 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
