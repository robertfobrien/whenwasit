"use client";

import { useState, useEffect } from "react";
import { Event, LeaderboardEntry } from "@/types";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [dailyEvents, setDailyEvents] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    year: "",
    emoji: "",
  });
  const [activeTab, setActiveTab] = useState<"events" | "daily" | "leaderboard">("events");

  useEffect(() => {
    const auth = localStorage.getItem("adminAuth");
    if (auth === "authenticated") {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const loadData = () => {
    // Load events
    const storedEvents = localStorage.getItem("customEvents");
    if (storedEvents) {
      setEvents(JSON.parse(storedEvents));
    } else {
      fetch("/api/events")
        .then((res) => res.json())
        .then((data) => {
          setEvents(data.events);
          localStorage.setItem("customEvents", JSON.stringify(data.events));
        });
    }

    // Load daily events
    const storedDaily = localStorage.getItem("dailyEventIds");
    if (storedDaily) {
      setDailyEvents(JSON.parse(storedDaily));
    }

    // Load leaderboard
    const storedLeaderboard = localStorage.getItem("leaderboard");
    if (storedLeaderboard) {
      const sorted = JSON.parse(storedLeaderboard).sort(
        (a: LeaderboardEntry, b: LeaderboardEntry) => b.totalScore - a.totalScore
      );
      setLeaderboard(sorted);
    }
  };

  const handleLogin = () => {
    if (password === "12345") {
      localStorage.setItem("adminAuth", "authenticated");
      setIsAuthenticated(true);
      loadData();
    } else {
      alert("Incorrect password!");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminAuth");
    setIsAuthenticated(false);
    setPassword("");
  };

  const saveEvents = (updatedEvents: Event[]) => {
    setEvents(updatedEvents);
    localStorage.setItem("customEvents", JSON.stringify(updatedEvents));
  };

  const handleAddEvent = () => {
    if (!newEvent.name || !newEvent.year || !newEvent.emoji) {
      alert("Please fill all fields");
      return;
    }

    const event: Event = {
      id: Date.now().toString(),
      name: newEvent.name,
      year: parseInt(newEvent.year),
      emoji: newEvent.emoji,
    };

    saveEvents([...events, event]);
    setNewEvent({ name: "", year: "", emoji: "" });
  };

  const handleDeleteEvent = (id: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      saveEvents(events.filter((e) => e.id !== id));
      // Also remove from daily if present
      const newDaily = dailyEvents.filter((eid) => eid !== id);
      setDailyEvents(newDaily);
      localStorage.setItem("dailyEventIds", JSON.stringify(newDaily));
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;

    saveEvents(events.map((e) => (e.id === editingEvent.id ? editingEvent : e)));
    setEditingEvent(null);
  };

  const toggleDailyEvent = (eventId: string) => {
    let newDaily: string[];
    if (dailyEvents.includes(eventId)) {
      newDaily = dailyEvents.filter((id) => id !== eventId);
    } else {
      if (dailyEvents.length >= 5) {
        alert("You can only select 5 events for today!");
        return;
      }
      newDaily = [...dailyEvents, eventId];
    }
    setDailyEvents(newDaily);
    localStorage.setItem("dailyEventIds", JSON.stringify(newDaily));
  };

  const handleDeleteLeaderboardEntry = (index: number) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      const newLeaderboard = leaderboard.filter((_, idx) => idx !== index);
      setLeaderboard(newLeaderboard);
      localStorage.setItem("leaderboard", JSON.stringify(newLeaderboard));
    }
  };

  const handleClearLeaderboard = () => {
    if (confirm("Are you sure you want to clear the entire leaderboard?")) {
      setLeaderboard([]);
      localStorage.setItem("leaderboard", JSON.stringify([]));
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "events.json";
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        saveEvents(imported);
        alert("Events imported successfully!");
      } catch (error) {
        alert("Error importing events. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 max-w-md w-full border border-white/20 dark:border-gray-700/50">
          <h1 className="text-4xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Admin Login 🔐
            </span>
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-6 py-4 text-lg text-center bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all text-gray-900 dark:text-white"
                placeholder="Enter password"
                autoFocus
              />
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl transition-all text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Login
            </button>

            <a
              href="/"
              className="block text-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors"
            >
              ← Back to Game
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-950 dark:to-purple-950">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-[2rem] shadow-2xl p-8 border border-white/20 dark:border-gray-700/50">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Admin Dashboard 🛠️
              </span>
            </h1>
            <div className="flex gap-3">
              <a
                href="/"
                className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 text-gray-700 dark:text-white font-semibold py-2 px-6 rounded-full transition-all shadow-md hover:shadow-lg"
              >
                View Game
              </a>
              <button
                onClick={handleLogout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-6 rounded-full transition-all shadow-md hover:shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-2xl">
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === "events"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              📝 Manage Events
            </button>
            <button
              onClick={() => setActiveTab("daily")}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === "daily"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              📅 Today's Events ({dailyEvents.length}/5)
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
                activeTab === "leaderboard"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              🏆 Leaderboard ({leaderboard.length})
            </button>
          </div>

          {/* Content */}
          {activeTab === "events" && (
            <div>
              {/* Import/Export */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={handleExport}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Export JSON
                </button>
                <label className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-md hover:shadow-lg cursor-pointer">
                  Import JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Add New Event */}
              <div className="mb-8 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900">
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  Add New Event
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Event name"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-400 dark:focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                  <input
                    type="number"
                    placeholder="Year (negative for BC)"
                    value={newEvent.year}
                    onChange={(e) => setNewEvent({ ...newEvent, year: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-400 dark:focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Emoji"
                    value={newEvent.emoji}
                    onChange={(e) => setNewEvent({ ...newEvent, emoji: e.target.value })}
                    className="px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:focus:ring-indigo-900 focus:border-indigo-400 dark:focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all"
                  />
                  <button
                    onClick={handleAddEvent}
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                  >
                    Add Event
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Use negative years for BC dates (e.g., -44 for 44 BC)
                </p>
              </div>

              {/* Events List */}
              <div>
                <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                  All Events ({events.length})
                </h2>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/80 rounded-2xl border border-gray-200 dark:border-gray-600"
                    >
                      {editingEvent?.id === event.id ? (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <input
                            type="text"
                            value={editingEvent.name}
                            onChange={(e) =>
                              setEditingEvent({ ...editingEvent, name: e.target.value })
                            }
                            className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                          />
                          <input
                            type="number"
                            value={editingEvent.year}
                            onChange={(e) =>
                              setEditingEvent({
                                ...editingEvent,
                                year: parseInt(e.target.value),
                              })
                            }
                            className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                          />
                          <input
                            type="text"
                            value={editingEvent.emoji}
                            onChange={(e) =>
                              setEditingEvent({ ...editingEvent, emoji: e.target.value })
                            }
                            className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <span className="text-3xl">{event.emoji}</span>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {event.name}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {Math.abs(event.year)} {event.year < 0 ? "BC" : "AD"}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {editingEvent?.id === event.id ? (
                          <>
                            <button
                              onClick={handleSaveEdit}
                              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl transition-all"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingEvent(null)}
                              className="bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-xl transition-all"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-xl transition-all"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl transition-all"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "daily" && (
            <div>
              <div className="mb-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900">
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                  Select Today's Events
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Choose exactly 5 events to display for today's game. Click events below to
                  toggle selection.
                </p>
              </div>

              <div className="space-y-3">
                {events.map((event) => {
                  const isSelected = dailyEvents.includes(event.id);
                  return (
                    <button
                      key={event.id}
                      onClick={() => toggleDailyEvent(event.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                        isSelected
                          ? "bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 border-indigo-500 dark:border-indigo-400 shadow-lg"
                          : "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/80 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{event.emoji}</span>
                        <div className="text-left">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {event.name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {Math.abs(event.year)} {event.year < 0 ? "BC" : "AD"}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <span className="text-2xl">✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Leaderboard Management
                </h2>
                <button
                  onClick={handleClearLeaderboard}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-6 rounded-xl transition-all shadow-md hover:shadow-lg"
                >
                  Clear All
                </button>
              </div>

              {leaderboard.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No leaderboard entries yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.map((entry, idx) => {
                    const totalTime = entry.results.reduce((sum, r) => sum + r.timeSpent, 0);
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                          entry.isPotentialCheater
                            ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                            : "bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-700/80 border-gray-200 dark:border-gray-600"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-gray-400 dark:text-gray-500 w-12 text-center">
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
                              {new Date(entry.date).toLocaleString()} • {totalTime}s • {entry.results.map((r) => r.emoji).join(" ")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {entry.totalScore}
                          </div>
                          <button
                            onClick={() => handleDeleteLeaderboardEntry(idx)}
                            className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-xl transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
