"use client";

import { useState, useEffect, useRef } from "react";
import { Event, GameResult } from "@/types";
import { calculateScore, formatShareText } from "@/lib/utils";

type GameState = "instructions" | "countdown" | "playing" | "complete";

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [gameState, setGameState] = useState<GameState>("instructions");
  const [countdown, setCountdown] = useState(3);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [yearInput, setYearInput] = useState("");
  const [isBC, setIsBC] = useState(false);
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isPotentialCheater, setIsPotentialCheater] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  // Load events
  useEffect(() => {
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

    // Check if guess is within valid range
    const minYear = actualYear - 200;
    const maxYear = actualYear + 200;

    if (guessedYear < minYear || guessedYear > maxYear) {
      alert(
        `Please guess within ${Math.abs(minYear)} ${
          minYear < 0 ? "BC" : "AD"
        } to ${Math.abs(maxYear)} ${maxYear < 0 ? "BC" : "AD"}`
      );
      return;
    }

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
        name: "Anonymous",
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
    const shareText = formatShareText(results, window.location.origin);
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <h1 className="text-5xl font-bold text-center mb-6 text-indigo-600 dark:text-indigo-400">
            WhenWasIt? 📅
          </h1>

          <div className="space-y-6 mb-8">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-xl">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                How to Play
              </h2>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">📜</span>
                  <span>You'll be shown 5 historical events</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🎯</span>
                  <span>Guess the year each event happened</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">⏱️</span>
                  <span>Answer as quickly as possible - you'll be timed!</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">🏆</span>
                  <span>Get 100 points for exact answer, -1 per year off</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">📍</span>
                  <span>Guesses must be within 200 years of the actual date</span>
                </li>
              </ul>
            </div>

            <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-xl border-2 border-red-200 dark:border-red-800">
              <h3 className="text-xl font-bold mb-2 text-red-900 dark:text-red-300 flex items-center gap-2">
                <span>⚠️</span> Fair Play Warning
              </h3>
              <p className="text-red-800 dark:text-red-200">
                Don't switch tabs or leave this page during the game! Doing so will mark you as a potential cheater on the leaderboard.
              </p>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-xl transition-all text-xl transform hover:scale-105"
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
          <div className="text-9xl font-bold text-indigo-600 dark:text-indigo-400 animate-pulse">
            {countdown > 0 ? countdown : "GO!"}
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
          <h1 className="text-4xl font-bold text-center mb-8 text-indigo-600 dark:text-indigo-400">
            Game Complete! 🎉
          </h1>

          {isPotentialCheater && (
            <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-600 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 font-semibold text-center">
                ⚠️ Marked as Potential Cheater
              </p>
              <p className="text-red-700 dark:text-red-300 text-sm text-center mt-1">
                You left the page during the game
              </p>
            </div>
          )}

          <div className="text-center mb-8">
            <p className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
              {totalScore}/500
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Total Score • {totalTime}s
            </p>
          </div>

          <div className="space-y-4 mb-8">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
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
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Share Results 📋
            </button>
            <a
              href="/leaderboard"
              className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
            >
              Leaderboard 🏆
            </a>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full mt-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-semibold py-3 px-6 rounded-lg transition-colors"
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Event {currentEventIndex + 1} of {events.length}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                ⏱️ {timer}s
              </span>
            </div>
          </div>

          <div className="text-7xl mb-6">{currentEvent.emoji}</div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {currentEvent.name}
          </h2>

          <p className="text-gray-600 dark:text-gray-400">
            When did this happen?
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Year
            </label>
            <input
              type="number"
              value={yearInput}
              onChange={(e) => setYearInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:bg-gray-700 dark:text-white text-lg"
              placeholder="Enter year"
              min="1"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Era
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setIsBC(false)}
                className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                  !isBC
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                AD
              </button>
              <button
                onClick={() => setIsBC(true)}
                className={`py-3 px-6 rounded-lg font-semibold transition-all ${
                  isBC
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                BC
              </button>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!yearInput}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
          >
            Submit Guess
          </button>
        </div>

        <div className="mt-6 flex justify-center gap-2">
          {events.map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full ${
                idx < currentEventIndex
                  ? "bg-green-500"
                  : idx === currentEventIndex
                  ? "bg-indigo-600"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
