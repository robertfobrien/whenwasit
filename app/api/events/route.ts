import { NextResponse } from "next/server";
import { getDailyEvents } from "@/lib/utils";
import eventsData from "@/data/events.json";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { Event } from "@/types";

const todayString = () => new Date().toISOString().split("T")[0];

interface DailySelectionRow {
  id?: string;
  event_ids: (string | number)[] | null;
  updated_at?: string | null;
}

function normaliseEvents(events: Event[]): Event[] {
  return events.map((event) => ({
    ...event,
    id: event.id.toString(),
  }));
}

export async function GET(request: Request) {
  const today = new Date();
  const todayStr = todayString();

  // Check if admin has selected specific daily events
  const { searchParams } = new URL(request.url);
  const checkAdmin = searchParams.get('checkAdmin');

  let supabaseEvents = normaliseEvents(eventsData as unknown as Event[]);
  let selectedDailyIds: string[] = [];
  let supabaseAvailable = false;

  try {
    const supabase = getSupabaseClient();
    supabaseAvailable = true;

    const { data, error } = await supabase
      .from("events")
      .select("id, name, year, emoji")
      .order("name", { ascending: true });

    if (!error && data && data.length > 0) {
      supabaseEvents = normaliseEvents(data as unknown as Event[]);
    } else if (error) {
      console.warn("Supabase events query failed", error.message);
    }

    const { data: selectionRow, error: selectionError } = await supabase
      .from("daily_event_selection")
      .select("id, event_ids")
      .eq("id", todayStr)
      .maybeSingle();

    const row = selectionRow as DailySelectionRow | null;

    if (!selectionError && row?.event_ids) {
      selectedDailyIds = row.event_ids
        .map((id: string | number) => id?.toString?.() ?? "")
        .filter((id): id is string => Boolean(id));
    }

    if (selectedDailyIds.length !== 5) {
      // Generate a fresh random selection for today
      const shuffled = [...supabaseEvents].sort(() => Math.random() - 0.5);
      selectedDailyIds = shuffled.slice(0, 5).map((event) => event.id.toString());

      const { error: upsertError } = await supabase.from("daily_event_selection").upsert(
        {
          id: todayStr,
          event_ids: selectedDailyIds,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (upsertError) {
        console.error("Failed to persist random daily selection", upsertError.message);
      }

      // Clean up old rows so only today's selection remains
      await supabase.from("daily_event_selection").delete().neq("id", todayStr);
    }
  } catch (err) {
    console.warn("Supabase unavailable, falling back to bundled events", err);
  }

  if (checkAdmin) {
    // Provide the full catalogue and current daily selection for admin tooling
    return NextResponse.json({
      date: todayStr,
      events: supabaseEvents,
      dailyEventIds: selectedDailyIds,
    });
  }

  let dailyEvents: Event[] = [];
  const eventsById = new Map(supabaseEvents.map((event) => [event.id.toString(), event]));

  if (selectedDailyIds.length === 5) {
    dailyEvents = selectedDailyIds
      .map((id) => eventsById.get(id))
      .filter((event): event is Event => Boolean(event));
  }

  if (dailyEvents.length < 5) {
    dailyEvents = supabaseAvailable
      ? [...supabaseEvents].sort(() => Math.random() - 0.5).slice(0, 5)
      : getDailyEvents(supabaseEvents, today);
  }

  return NextResponse.json({
    date: todayStr,
    events: dailyEvents,
  });
}
