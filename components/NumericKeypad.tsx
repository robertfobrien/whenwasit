"use client";

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

export default function NumericKeypad({ value, onChange, maxLength = 4 }: NumericKeypadProps) {
  const handleNumberClick = (num: string) => {
    if (value.length < maxLength) {
      onChange(value + num);
    }
  };

  const handleBackspace = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Display */}
      <div className="mb-8 p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-[2rem] shadow-xl min-h-[100px] flex items-center justify-center backdrop-blur-sm">
        <div className="text-6xl font-bold text-center tracking-wider">
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent drop-shadow-sm">
            {value || "____"}
          </span>
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-4">
        {numbers.slice(0, 9).map((num) => (
          <button
            key={num}
            onClick={() => handleNumberClick(num)}
            className="aspect-square bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-pink-600 text-gray-900 dark:text-white hover:text-white text-4xl font-bold rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all duration-200 transform active:scale-90 hover:scale-105"
          >
            {num}
          </button>
        ))}

        {/* Bottom row */}
        <button
          onClick={handleClear}
          className="aspect-square bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/20 hover:from-red-500 hover:to-red-600 text-red-600 dark:text-red-400 hover:text-white text-lg font-bold rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all duration-200 transform active:scale-90 hover:scale-105"
        >
          Clear
        </button>

        <button
          onClick={() => handleNumberClick("0")}
          className="aspect-square bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 dark:hover:from-indigo-600 dark:hover:via-purple-600 dark:hover:to-pink-600 text-gray-900 dark:text-white hover:text-white text-4xl font-bold rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all duration-200 transform active:scale-90 hover:scale-105"
        >
          0
        </button>

        <button
          onClick={handleBackspace}
          className="aspect-square bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 hover:from-orange-500 hover:to-orange-600 text-orange-600 dark:text-orange-400 hover:text-white text-3xl font-bold rounded-[1.5rem] shadow-lg hover:shadow-2xl transition-all duration-200 transform active:scale-90 hover:scale-105 flex items-center justify-center"
        >
          ←
        </button>
      </div>
    </div>
  );
}
