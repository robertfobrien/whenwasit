"use client";

import { useState, useEffect } from "react";
import { Event } from "@/types";

export default function Admin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    year: "",
    emoji: "",
  });

  useEffect(() => {
    // Load events from localStorage (in production, this would be from a database)
    const stored = localStorage.getItem("customEvents");
    if (stored) {
      setEvents(JSON.parse(stored));
    } else {
      // Load default events
      fetch("/api/events")
        .then((res) => res.json())
        .then((data) => {
          setEvents(data.events);
          localStorage.setItem("customEvents", JSON.stringify(data.events));
        });
    }
  }, []);

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
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleSaveEdit = () => {
    if (!editingEvent) return;

    saveEvents(
      events.map((e) => (e.id === editingEvent.id ? editingEvent : e))
    );
    setEditingEvent(null);
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

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">
              🔧 Admin Panel
            </h1>
            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Export JSON
              </button>
              <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer">
                Import JSON
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <a
                href="/"
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Back to Game
              </a>
            </div>
          </div>

          {/* Add New Event */}
          <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Add New Event
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Event name"
                value={newEvent.name}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, name: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="number"
                placeholder="Year (negative for BC)"
                value={newEvent.year}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, year: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              <input
                type="text"
                placeholder="Emoji"
                value={newEvent.emoji}
                onChange={(e) =>
                  setNewEvent({ ...newEvent, emoji: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
              />
              <button
                onClick={handleAddEvent}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
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
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  {editingEvent?.id === event.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <input
                        type="text"
                        value={editingEvent.name}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            name: e.target.value,
                          })
                        }
                        className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
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
                        className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
                      />
                      <input
                        type="text"
                        value={editingEvent.emoji}
                        onChange={(e) =>
                          setEditingEvent({
                            ...editingEvent,
                            emoji: e.target.value,
                          })
                        }
                        className="px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-indigo-500 dark:bg-gray-800 dark:text-white"
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
                          className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingEvent(null)}
                          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
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
      </div>
    </div>
  );
}
