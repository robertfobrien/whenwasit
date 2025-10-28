"use client";

import { useEffect, useRef, useState } from "react";

interface YearScrollerProps {
  onChange: (year: number) => void;
  minYear: number;
  maxYear: number;
}

export default function YearScroller({ onChange, minYear, maxYear }: YearScrollerProps) {
  // Convert years to absolute values for display
  const absMin = Math.abs(minYear);
  const absMax = Math.abs(maxYear);

  // Calculate ranges
  const minCentury = Math.floor(absMin / 100);
  const maxCentury = Math.floor(absMax / 100);

  const [century, setCentury] = useState(Math.floor((minCentury + maxCentury) / 2));
  const [tens, setTens] = useState(5);
  const [ones, setOnes] = useState(0);

  useEffect(() => {
    const year = century * 100 + tens * 10 + ones;
    onChange(year);
  }, [century, tens, ones, onChange]);

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Year Display */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl px-8 py-6 shadow-2xl">
        <div className="text-center">
          <div className="text-sm font-semibold opacity-80 mb-1">Your Guess</div>
          <div className="text-5xl font-bold tracking-wider">
            {String(century).padStart(2, '0')}{String(tens)}{String(ones)}
          </div>
        </div>
      </div>

      {/* Scroll Wheels */}
      <div className="flex items-center justify-center gap-3">
        <ScrollWheel
          value={century}
          onChange={setCentury}
          min={minCentury}
          max={maxCentury}
          label="Century"
          color="indigo"
        />
        <div className="text-4xl font-bold text-indigo-300 dark:text-indigo-600 mb-8">•</div>
        <ScrollWheel
          value={tens}
          onChange={setTens}
          min={0}
          max={9}
          label="Tens"
          color="purple"
        />
        <div className="text-4xl font-bold text-purple-300 dark:text-purple-600 mb-8">•</div>
        <ScrollWheel
          value={ones}
          onChange={setOnes}
          min={0}
          max={9}
          label="Ones"
          color="pink"
        />
      </div>
    </div>
  );
}

interface ScrollWheelProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  color: string;
}

function ScrollWheel({ value, onChange, min, max, label, color }: ScrollWheelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const itemHeight = 56;

  const colorClasses = {
    indigo: {
      bg: "bg-gradient-to-b from-indigo-100 to-indigo-50 dark:from-indigo-900/30 dark:to-indigo-800/20",
      border: "border-indigo-400 dark:border-indigo-500",
      highlight: "bg-indigo-400/20 dark:bg-indigo-500/30",
      text: "text-indigo-600 dark:text-indigo-300"
    },
    purple: {
      bg: "bg-gradient-to-b from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-800/20",
      border: "border-purple-400 dark:border-purple-500",
      highlight: "bg-purple-400/20 dark:bg-purple-500/30",
      text: "text-purple-600 dark:text-purple-300"
    },
    pink: {
      bg: "bg-gradient-to-b from-pink-100 to-pink-50 dark:from-pink-900/30 dark:to-pink-800/20",
      border: "border-pink-400 dark:border-pink-500",
      highlight: "bg-pink-400/20 dark:bg-pink-500/30",
      text: "text-pink-600 dark:text-pink-300"
    }
  }[color];

  useEffect(() => {
    if (scrollRef.current && !isDragging) {
      const index = value - min;
      scrollRef.current.scrollTo({
        top: index * itemHeight,
        behavior: "smooth",
      });
    }
  }, [value, min, isDragging]);

  const handleScroll = () => {
    if (scrollRef.current && !isDragging) {
      const scrollTop = scrollRef.current.scrollTop;
      const index = Math.round(scrollTop / itemHeight);
      const newValue = Math.max(min, Math.min(max, min + index));
      if (newValue !== value) {
        onChange(newValue);
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startY.current = e.touches[0].clientY;
    startValue.current = value;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;

    const deltaY = startY.current - e.touches[0].clientY;
    const itemsMoved = Math.round(deltaY / itemHeight);
    const newValue = Math.max(min, Math.min(max, startValue.current + itemsMoved));

    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    const newValue = Math.max(min, Math.min(max, value + delta));
    onChange(newValue);
  };

  const handleClick = (item: number) => {
    onChange(item);
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`text-xs font-bold uppercase tracking-wider mb-3 ${colorClasses.text}`}>
        {label}
      </div>
      <div
        className={`relative w-20 h-56 overflow-hidden ${colorClasses.bg} rounded-2xl shadow-lg border-2 ${colorClasses.border}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        {/* Top fade */}
        <div className={`absolute top-0 left-0 right-0 h-20 ${colorClasses.bg} bg-gradient-to-b z-10 pointer-events-none`}
             style={{
               background: color === 'indigo'
                 ? 'linear-gradient(to bottom, rgba(224, 231, 255, 1) 0%, rgba(224, 231, 255, 0) 100%)'
                 : color === 'purple'
                 ? 'linear-gradient(to bottom, rgba(243, 232, 255, 1) 0%, rgba(243, 232, 255, 0) 100%)'
                 : 'linear-gradient(to bottom, rgba(252, 231, 243, 1) 0%, rgba(252, 231, 243, 0) 100%)'
             }}
        />

        {/* Selection indicator */}
        <div className={`absolute top-1/2 left-0 right-0 h-14 -mt-7 border-y-3 ${colorClasses.border} ${colorClasses.highlight} z-10 pointer-events-none rounded-lg`} />

        {/* Bottom fade */}
        <div className={`absolute bottom-0 left-0 right-0 h-20 ${colorClasses.bg} bg-gradient-to-t z-10 pointer-events-none`}
             style={{
               background: color === 'indigo'
                 ? 'linear-gradient(to top, rgba(224, 231, 255, 1) 0%, rgba(224, 231, 255, 0) 100%)'
                 : color === 'purple'
                 ? 'linear-gradient(to top, rgba(243, 232, 255, 1) 0%, rgba(243, 232, 255, 0) 100%)'
                 : 'linear-gradient(to top, rgba(252, 231, 243, 1) 0%, rgba(252, 231, 243, 0) 100%)'
             }}
        />

        {/* Scroll container */}
        <div
          ref={scrollRef}
          className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
          onScroll={handleScroll}
          style={{
            scrollSnapType: "y mandatory",
            paddingTop: `${itemHeight * 3.5}px`,
            paddingBottom: `${itemHeight * 3.5}px`,
          }}
        >
          {items.map((item) => {
            const distance = Math.abs(item - value);
            const isSelected = item === value;
            return (
              <div
                key={item}
                className="flex items-center justify-center snap-center cursor-pointer transition-all duration-200"
                style={{
                  height: `${itemHeight}px`,
                  fontSize: isSelected ? "2.5rem" : distance === 1 ? "1.75rem" : "1.25rem",
                  fontWeight: isSelected ? "800" : distance === 1 ? "600" : "400",
                  opacity: distance > 2 ? 0.2 : distance === 2 ? 0.4 : distance === 1 ? 0.7 : 1,
                  transform: isSelected ? "scale(1.1)" : "scale(1)",
                }}
                onClick={() => handleClick(item)}
              >
                <span className={isSelected ? colorClasses.text : "text-gray-600 dark:text-gray-300"}>
                  {String(item).padStart(label === "Century" ? 2 : 1, "0")}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
