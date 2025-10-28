#!/usr/bin/env node
// Quick Supabase connectivity smoke test. Reads env vars (or .env.local) and
// fetches a few records from the REST API so you can confirm the shared DB is reachable.

const fs = require("fs");
const path = require("path");

const ENV_FILENAMES = [".env.local", ".env"];

function loadEnvFile(filename) {
  const fullPath = path.resolve(process.cwd(), filename);
  if (!fs.existsSync(fullPath)) return;

  const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    if (!line || line.trim().startsWith("#")) return;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) return;
    const key = line.slice(0, eqIndex).trim();
    const rawValue = line.slice(eqIndex + 1).trim();
    const value = rawValue.replace(/^"|"$/g, "");
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  });
}

ENV_FILENAMES.forEach(loadEnvFile);

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error(
    "Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_KEY (or NEXT_PUBLIC_SUPABASE_*)."
  );
  process.exit(1);
}

async function fetchJson(endpoint) {
  const response = await fetch(endpoint, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Request to ${endpoint} failed (${response.status}): ${text || response.statusText}`
    );
  }

  return response.json();
}

async function main() {
  console.log("Checking Supabase at", SUPABASE_URL);

  const eventsEndpoint = `${SUPABASE_URL}/rest/v1/events?select=id,name,year,emoji&limit=3`;
  const leaderboardEndpoint = `${SUPABASE_URL}/rest/v1/leaderboard_entries?select=name,total_score,played_at&order=played_at.desc&limit=3`;

  try {
    const events = await fetchJson(eventsEndpoint);
    if (events.length === 0) {
      console.warn("No events found. Seed the events table to enable gameplay.");
    } else {
      console.log("Sample events:");
      events.forEach((event, idx) => {
        console.log(`  ${idx + 1}. ${event.emoji || ""} ${event.name} (${event.year})`);
      });
    }
  } catch (error) {
    console.error("Failed to fetch events:", error.message);
  }

  try {
    const entries = await fetchJson(leaderboardEndpoint);
    if (entries.length === 0) {
      console.warn("No leaderboard entries yet. Play a round to create one.");
    } else {
      console.log("Recent leaderboard entries:");
      entries.forEach((entry, idx) => {
        console.log(
          `  ${idx + 1}. ${entry.name} – ${entry.total_score} points on ${new Date(
            entry.played_at
          ).toLocaleString()}`
        );
      });
    }
  } catch (error) {
    console.error("Failed to fetch leaderboard entries:", error.message);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
