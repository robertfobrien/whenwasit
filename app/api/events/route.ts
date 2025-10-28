import { NextResponse } from "next/server";
import { getDailyEvents } from "@/lib/utils";
import eventsData from "@/data/events.json";
import { getSupabaseClient } from "@/lib/supabaseClient";

export async function GET(request: Request) {
  const today = new Date();

  // Check if admin has selected specific daily events
  const { searchParams } = new URL(request.url);
  const checkAdmin = searchParams.get('checkAdmin');

  let supabaseEvents = eventsData;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, name, year, emoji")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      supabaseEvents = data;
    } else if (error) {
      console.warn("Supabase events query failed", error.message);
    }
  } catch (err) {
    console.warn("Supabase unavailable, falling back to bundled events", err);
  }

  if (checkAdmin) {
    // This will be called from client-side with localStorage access
    // For now, just return all events and let client handle it
    return NextResponse.json({
      date: today.toISOString().split('T')[0],
      events: supabaseEvents,
      allEvents: true,
    });
  }

  // Default behavior: use date-based rotation
  const dailyEvents = getDailyEvents(supabaseEvents, today);

  return NextResponse.json({
    date: today.toISOString().split('T')[0],
    events: dailyEvents,
  });
}
