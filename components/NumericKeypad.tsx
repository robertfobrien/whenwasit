"use client";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onToggleEra: () => void;
  isBC: boolean;
  maxLength?: number;
}

export default function NumericKeypad({
  value,
  onChange,
  onToggleEra,
  isBC,
  maxLength = 4,
}: NumericKeypadProps) {
  const handleNumberClick = (num: string) => {
    if (value.length < maxLength) {
      onChange(value + num);
    }
  };

  const handleClear = () => {
    onChange("");
  };

  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];
  const eraColorClasses = isBC
    ? "text-amber-500 dark:text-amber-300"
    : "text-indigo-600 dark:text-indigo-300";
  const yearDisplayClasses = value
    ? `drop-shadow-sm transition-colors duration-200 ${eraColorClasses}`
    : "drop-shadow-sm text-gray-300 dark:text-gray-600";

  return (
    <div className="w-full max-w-sm mx-auto flex flex-1 flex-col gap-5 sm:gap-6 h-full">
      {/* Display */}
      <div className="p-6 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-[1.75rem] shadow-lg min-h-[92px] sm:min-h-[88px] flex items-center justify-center backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className={`text-6xl font-bold leading-none ${yearDisplayClasses}`}>
            {value || "____"}
          </span>
          <span className="text-5xl font-semibold text-slate-300/80 dark:text-slate-500/80 leading-none">
            |
          </span>
          <span
            className={`text-6xl font-bold uppercase tracking-[0.1em] leading-none transition-colors duration-200 ${eraColorClasses}`}
          >
            {isBC ? "BC" : "AD"}
          </span>
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 auto-rows-fr">
        {numbers.slice(0, 9).map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="h-36 sm:h-24 w-full overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-pink-600 text-gray-900 dark:text-white hover:text-white font-bold rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all duration-200 transform active:scale-90 hover:scale-[1.05] flex items-center justify-center px-2"
          >
            <span className="wwi-keypad-num">{num}</span>
          </button>
        ))}

        {/* Bottom row */}
        <button
          onClick={handleClear}
          className="h-36 sm:h-24 w-full overflow-hidden bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 hover:from-red-500 hover:to-red-600 text-red-600 dark:text-red-400 hover:text-white font-bold rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all duration-200 transform active:scale-90 hover:scale-[1.05] flex items-center justify-center px-2"
        >
          <span className="wwi-keypad-action">Clear</span>
        </button>

        <button
          onClick={() => handleNumberClick("0")}
          className="h-36 sm:h-24 w-full overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-pink-600 text-gray-900 dark:text-white hover:text-white font-bold rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all duration-200 transform active:scale-90 hover:scale-[1.05] flex items-center justify-center px-2"
        >
          <span className="wwi-keypad-num">0</span>
        </button>

        <button
          onClick={onToggleEra}
          className="h-36 sm:h-24 w-full overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-pink-600 text-indigo-600 dark:text-indigo-200 font-bold rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all duration-200 transform active:scale-90 hover:scale-[1.05] flex flex-col items-center justify-center px-2"
        >
          <span className="wwi-keypad-era">{isBC ? "BC" : "AD"}</span>
          <span className="text-xs tracking-widest text-gray-500 dark:text-gray-300">toggle</span>
        </button>
      </div>
    </div>
  );
}
