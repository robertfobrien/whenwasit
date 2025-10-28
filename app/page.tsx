"use client";

import { useState, useEffect, useRef } from "react";
import { Event, GameResult } from "@/types";
import { calculateScore, formatShareText } from "@/lib/utils";
import NumericKeypad from "@/components/NumericKeypad";

type GameState = "instructions" | "countdown" | "playing" | "complete";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [gameState, setGameState] = useState<GameState>("instructions");
  const [username, setUsername] = useState("");
  const [countdown, setCountdown] = useState(3);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [yearInput, setYearInput] = useState("");
  const [isBC, setIsBC] = useState(false);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isPotentialCheater, setIsPotentialCheater] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  // Load events
  useEffect(() => {
    // Check if admin has selected specific events
    const dailyEventIds = localStorage.getItem("dailyEventIds");
    const customEvents = localStorage.getItem("customEvents");

    if (dailyEventIds && customEvents) {
      const ids = JSON.parse(dailyEventIds);
      const allEvents = JSON.parse(customEvents);

      if (ids.length === 5) {
        // Use admin-selected events
        const selectedEvents = ids
          .map((id: string) => allEvents.find((e: Event) => e.id === id))
          .filter(Boolean);
        setEvents(selectedEvents);
        setLoading(false);
        return;
      }
    }

    // Otherwise use API (date-based rotation)
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events);
        setLoading(false);
      });
  }, []);

  // Detect page visibility change (potential cheating)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && gameState === "playing") {
        setIsPotentialCheater(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameState]);

  // Timer for each question
  useEffect(() => {
    if (gameState === "playing") {
      questionStartTimeRef.current = Date.now();
      setTimer(0);

      timerRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [gameState, currentEventIndex]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startGame = () => {
    setGameState("countdown");

    let count = 3;
    setCountdown(count);

    const countdownInterval = setInterval(() => {
      count--;
      setCountdown(count);

      if (count === 0) {
        clearInterval(countdownInterval);
        setTimeout(() => {
          setGameState("playing");
        }, 500);
      }
    }, 1000);
  };

  const handleSubmit = () => {
    if (!yearInput) return;

    const currentEvent = events[currentEventIndex];
    const guessedYear = isBC ? -parseInt(yearInput) : parseInt(yearInput);
    const actualYear = currentEvent.year;

    const score = calculateScore(guessedYear, actualYear);
    const timeSpent = timer;

    const result: GameResult = {
      eventId: currentEvent.id,
      guessedYear,
      actualYear,
      score,
      emoji: currentEvent.emoji,
      timeSpent,
    };

    const newResults = [...results, result];
    setResults(newResults);

    if (currentEventIndex === events.length - 1) {
      // Game complete
      setGameState("complete");

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Save to leaderboard
      const leaderboard = JSON.parse(
        localStorage.getItem("leaderboard") || "[]"
      );
      const entry = {
        name: username || "Anonymous",
        totalScore: newResults.reduce((sum, r) => sum + r.score, 0),
        date: new Date().toISOString(),
        results: newResults,
        isPotentialCheater,
      };
      leaderboard.push(entry);
      localStorage.setItem("leaderboard", JSON.stringify(leaderboard));
    } else {
      setCurrentEventIndex(currentEventIndex + 1);
      setYearInput("");
      setIsBC(false);
    }
  };

  const handleShare = () => {
    const shareText = formatShareText(results, window.location.origin, isPotentialCheater);
    navigator.clipboard.writeText(shareText);
    alert("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  // Instructions Screen
  if (gameState === "instructions") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-lg w-full">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                WhenWasIt? 📅
              </span>
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Test your knowledge of history!
            </p>
          </div>

          {/* Username Input */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3 text-center">
              Enter your name (optional)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && startGame()}
              className="w-full px-6 py-4 text-lg text-center bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
              placeholder="Your name"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 text-center">
              Will appear on the leaderboard
            </p>
          </div>

          <div className="space-y-6 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white text-center">
                How to Play
              </h2>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-xl">📜</span>
                  <span>Guess when 5 historical events happened</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">⏱️</span>
                  <span>Race against the clock for each event</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">🎯</span>
                  <span>100 points for exact year, -1 point per year off</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">🏆</span>
                  <span>Compete on the leaderboard!</span>
                </li>
              </ul>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-5 px-6 rounded-2xl transition-all text-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Game 🚀
          </button>

          <a
            href="/leaderboard"
            className="block text-center mt-4 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
          >
            View Leaderboard 🏆
          </a>
        </div>
      </div>
    );
  }

  // Countdown Screen
  if (gameState === "countdown") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="text-9xl font-bold animate-pulse">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-300 dark:to-purple-300 bg-clip-text text-transparent">
              {countdown > 0 ? countdown : "GO!"}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Game Complete Screen
  if (gameState === "complete") {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Game Complete! 🎉
            </span>
          </h1>

          {isPotentialCheater && (
            <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-2xl p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 font-semibold text-center">
                ⚠️ Marked as Potential Cheater
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm text-center mt-1">
                You left the page during the game
              </p>
            </div>
          )}

          <div className="text-center mb-8">
            <p className="text-6xl font-bold mb-2">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {totalScore}/500
              </span>
            </p>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Total Score • {totalTime}s
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/80 rounded-2xl border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{result.emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {events[idx].name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Guessed: {Math.abs(result.guessedYear)}{" "}
                      {result.guessedYear < 0 ? "BC" : "AD"} | Actual:{" "}
                      {Math.abs(result.actualYear)}{" "}
                      {result.actualYear < 0 ? "BC" : "AD"} | {result.timeSpent}s
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {result.score}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleShare}
              className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Share Results 📋
            </button>
            <a
              href="/leaderboard"
              className="flex-1 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-bold py-4 px-6 rounded-2xl transition-all text-center border-2 border-gray-200 dark:border-gray-600 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Leaderboard 🏆
            </a>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full mt-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium py-3 transition-colors"
          >
            Play Again
          </button>
        </div>
      </div>
    );
  }

  // Playing Screen
  const currentEvent = events[currentEventIndex];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full border border-white/20 dark:border-gray-700/50">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 px-4 py-2 rounded-full">
            <span className="text-3xl drop-shadow-sm">{currentEvent.emoji}</span>
            <span className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {currentEventIndex + 1}/{events.length}
            </span>
          </div>
          <div className="bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 px-5 py-2 rounded-full">
            <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              ⏱️ {timer}s
            </span>
          </div>
        </div>

        {/* Event Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-tight">
            {currentEvent.name}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            When did this happen?
          </p>
        </div>

        {/* Year Display */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 border-2 border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 text-center font-medium">
              Your Guess
            </p>
            <div className="text-5xl font-bold text-center text-gray-900 dark:text-white min-h-[3rem] flex items-center justify-center gap-2">
              {yearInput || "____"}
              <span className="text-3xl text-gray-600 dark:text-gray-400">
                {isBC ? "BC" : "AD"}
              </span>
            </div>
          </div>
        </div>

        {/* Era Slider */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setIsBC(!isBC)}
            className="relative w-72 h-20 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full transition-all shadow-inner"
          >
            {/* Slider Track */}
            <div
              className={`absolute top-2 ${
                isBC ? "left-2" : "left-[calc(100%-9.5rem)]"
              } w-36 h-16 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-xl transition-all duration-300 ease-out`}
            />
            {/* Labels */}
            <div className="absolute inset-0 flex items-center justify-between px-12">
              <span
                className={`font-bold text-3xl z-10 transition-all duration-300 ${
                  isBC ? "text-white scale-110" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                BC
              </span>
              <span
                className={`font-bold text-3xl z-10 transition-all duration-300 ${
                  !isBC ? "text-white scale-110" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                AD
              </span>
            </div>
          </button>
        </div>

        {/* Numeric Keypad */}
        <div className="mb-8">
          <NumericKeypad value={yearInput} onChange={setYearInput} maxLength={4} />
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!yearInput}
          className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-[1.5rem] transition-all duration-200 text-xl shadow-xl hover:shadow-2xl transform active:scale-95 hover:scale-[1.02]"
        >
          Submit Guess ✨
        </button>

        {/* Progress Dots */}
        <div className="mt-8 flex justify-center gap-2.5">
          {events.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx < currentEventIndex
                  ? "bg-gradient-to-r from-green-400 to-emerald-500 w-10 shadow-md"
                  : idx === currentEventIndex
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-10 shadow-lg"
                  : "bg-gray-300 dark:bg-gray-600 w-2.5"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
