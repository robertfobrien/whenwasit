"use client";

import { useState, useEffect } from "react";
import { LeaderboardEntry } from "@/types";

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage for now
    const stored = localStorage.getItem("leaderboard");
    if (stored) {
      const data = JSON.parse(stored);
      const sorted = data.sort((a: LeaderboardEntry, b: LeaderboardEntry) =>
        b.totalScore - a.totalScore
      );
      setEntries(sorted.slice(0, 100));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              🏆 Leaderboard
            </h1>
            <a
              href="/"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Play Game
            </a>
          </div>

          {entries.length === 0 ? (
            <p className="text-center text-gray-600 dark:text-gray-400 py-8">
              No entries yet. Be the first to play!
            </p>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, idx) => {
                const totalTime = entry.results.reduce((sum, r) => sum + r.timeSpent, 0);
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                      entry.isPotentialCheater
                        ? "bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800"
                        : "bg-gray-50 dark:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 w-8">
                        #{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {entry.name}
                          </p>
                          {entry.isPotentialCheater && (
                            <span className="text-red-600 dark:text-red-400" title="Potential Cheater">
                              ⚠️
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(entry.date).toLocaleDateString()} • {totalTime}s
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {entry.results.map((r) => r.emoji).join(" ")}
                      </div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {entry.totalScore}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
