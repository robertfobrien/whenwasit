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
  const goTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      if (goTimeoutRef.current) {
        clearTimeout(goTimeoutRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const startGame = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (goTimeoutRef.current) {
      clearTimeout(goTimeoutRef.current);
      goTimeoutRef.current = null;
    }

    setCountdown(3);
    setGameState("countdown");

    let nextValue = 3;
    countdownRef.current = setInterval(() => {
      nextValue -= 1;

      if (nextValue > 0) {
        setCountdown(nextValue);
        return;
      }

      setCountdown(0);

      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }

      goTimeoutRef.current = setTimeout(() => {
        setGameState("playing");
        setCountdown(3);
      }, 600);
    }, 1000);
  };

  const handleSubmit = async () => {
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
      const entry = {
        name: username || "Anonymous",
        totalScore: newResults.reduce((sum, r) => sum + r.score, 0),
        date: new Date().toISOString(),
        results: newResults,
        isPotentialCheater,
      };

      try {
        await fetch("/api/leaderboard", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(entry),
        });
      } catch (error) {
        console.error("Failed to post leaderboard entry", error);
      }
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
      <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-violet-100 via-sky-100 to-rose-100 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-900 px-6 py-12">
        <div className="w-full max-w-xl rounded-[2.5rem] bg-white/90 dark:bg-gray-900/80 backdrop-blur-xl border border-white/40 dark:border-gray-700/60 shadow-[0_30px_80px_rgba(79,70,229,0.25)] px-6 py-10 sm:px-10 flex flex-col gap-8">
          <div className="text-center space-y-3">
            <p className="inline-flex items-center rounded-full bg-indigo-100/80 dark:bg-indigo-900/50 px-4 py-1 text-sm font-semibold text-indigo-600 dark:text-indigo-300 tracking-[0.2em] uppercase">
              Daily history challenge
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                WhenWasIt? 📅
              </span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
              Guess the year of five iconic events before the clock runs out.
            </p>
          </div>

          {/* Username Input */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400 text-center">
              leaderboard name (optional)
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && startGame()}
              className="w-full rounded-2xl border border-gray-200/80 dark:border-gray-700 bg-white/90 dark:bg-gray-800/80 px-6 py-4 text-center text-lg text-gray-900 dark:text-white placeholder:text-gray-300 focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-400 dark:focus:border-indigo-500 transition"
              placeholder="Play as..."
              maxLength={20}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              No account needed — your results stay on this device.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: "📜", text: "Five events per round" },
              { icon: "⏱️", text: "Timer per question" },
              { icon: "🎯", text: "Closer = higher score" },
              { icon: "🏆", text: "Share + leaderboard" },
            ].map((item) => (
              <div
                key={item.text}
                className="flex items-center gap-3 rounded-2xl border border-indigo-100/60 dark:border-indigo-900/60 bg-gradient-to-br from-white/80 to-indigo-50/60 dark:from-indigo-950/40 dark:to-purple-950/40 px-4 py-4 shadow-sm"
              >
                <span className="text-2xl">{item.icon}</span>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={startGame}
              className="w-full rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-5 text-lg font-semibold text-white shadow-lg shadow-purple-500/30 transition-transform duration-200 hover:scale-[1.02] active:scale-95"
            >
              Start the Countdown 🚀
            </button>
            <a
              href="/leaderboard"
              className="text-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-300"
            >
              Peek at today’s leaderboard ↗
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Countdown Screen
  if (gameState === "countdown") {
    return (
      <div className="min-h-[100svh] flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-pink-800 text-white">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="inline-flex h-40 w-40 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <span className="text-7xl font-black tracking-tight drop-shadow-xl">
              {countdown > 0 ? countdown : "GO"}
            </span>
          </div>
          <p className="text-sm uppercase tracking-[0.4em] opacity-80">Get ready…</p>
        </div>
      </div>
    );
  }

  // Game Complete Screen
  if (gameState === "complete") {
    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0);

    return (
      <div className="min-h-[100svh] flex items-center justify-center px-6 py-12 bg-gradient-to-br from-violet-100 via-sky-100 to-rose-100 dark:from-gray-950 dark:via-indigo-950 dark:to-purple-900">
        <div className="w-full max-w-3xl rounded-[2.5rem] bg-white/90 dark:bg-gray-900/85 backdrop-blur-[18px] border border-white/40 dark:border-gray-800/60 shadow-[0_35px_90px_rgba(79,70,229,0.25)] px-6 py-10 sm:px-12 space-y-8">
          <h1 className="text-center text-4xl sm:text-5xl font-bold">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
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

          <div className="text-center">
            <p className="text-6xl font-black tracking-tight mb-3">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                {totalScore}
              </span>
              <span className="text-2xl text-gray-500 dark:text-gray-400"> / 500</span>
            </p>
            <p className="text-base font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
              {totalTime}s total
            </p>
          </div>

          <div className="grid gap-4">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-indigo-100/70 dark:border-indigo-900/50 bg-gradient-to-r from-white/90 to-indigo-50/60 dark:from-gray-800/60 dark:to-indigo-900/40 px-5 py-4 shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{result.emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white leading-tight">
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
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300">
                  {result.score}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleShare}
              className="flex-1 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/30 transition-transform duration-200 hover:scale-[1.01] active:scale-95"
            >
              Share Results 📋
            </button>
            <a
              href="/leaderboard"
              className="flex-1 rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 bg-white/80 dark:bg-gray-800/70 py-4 text-center text-lg font-semibold text-indigo-600 dark:text-indigo-300 shadow-md hover:bg-white hover:text-indigo-700 dark:hover:bg-gray-800/90"
            >
              Leaderboard 🏆
            </a>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full text-sm font-semibold uppercase tracking-[0.3em] text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
    <div className="min-h-[100svh] bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 dark:from-black dark:via-slate-950 dark:to-indigo-950 px-4 py-6 flex items-center justify-center">
      <div className="w-full max-w-md rounded-[2.5rem] border border-white/30 dark:border-gray-800/60 bg-white/85 dark:bg-gray-900/85 backdrop-blur-[18px] shadow-[0_35px_90px_rgba(15,23,42,0.55)] px-6 py-6 sm:px-8 sm:py-8 flex flex-col h-full max-h-[720px]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3 rounded-full bg-indigo-100/80 dark:bg-indigo-900/30 px-4 py-2">
            <span className="text-3xl drop-shadow-sm">{currentEvent.emoji}</span>
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-600 dark:text-indigo-300">
              {currentEventIndex + 1}/{events.length}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-slate-900 text-white px-4 py-2 shadow-lg shadow-slate-900/30 dark:bg-white/10">
            <span className="text-base font-semibold">⏱️</span>
            <span className="text-sm font-bold tracking-[0.3em]">
              {timer.toString().padStart(2, "0")}s
            </span>
          </div>
        </div>

        {/* Event Title */}
        <div className="text-center mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-gray-500 dark:text-gray-400 mb-2">
            Guess the year
          </p>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white leading-tight">
            {currentEvent.name}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            When did this happen?
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-6">
          <NumericKeypad
            value={yearInput}
            onChange={setYearInput}
            isBC={isBC}
            onToggleEra={() => setIsBC((prev) => !prev)}
            maxLength={4}
          />

          <button
            onClick={handleSubmit}
            disabled={!yearInput}
            className="w-full rounded-[1.5rem] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-4 text-lg font-semibold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-[1.01] active:scale-95 disabled:cursor-not-allowed disabled:bg-gradient-to-r disabled:from-slate-300 disabled:to-slate-400 dark:disabled:from-gray-700 dark:disabled:to-gray-800"
          >
            Lock It In ✨
          </button>
        </div>

        {/* Progress Dots */}
        <div className="mt-6 flex justify-center gap-2.5">
          {events.map((_, idx) => (
            <div
              key={idx}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                idx < currentEventIndex
                  ? "bg-gradient-to-r from-emerald-400 to-emerald-500 w-10 shadow-md"
                  : idx === currentEventIndex
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 w-10 shadow-lg"
                  : "bg-gray-300/80 dark:bg-gray-600/80 w-2.5"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
