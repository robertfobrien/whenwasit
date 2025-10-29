import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";
import eventsData from "@/data/events.json";
import { Event } from "@/types";

const todayString = () => new Date().toISOString().split("T")[0];

interface DailySelectionRow {
  id: string;
  event_ids: string[] | null;
  updated_at?: string | null;
}

function normaliseEvents(events: Event[]): Event[] {
  return events.map((event) => ({
    ...event,
    id: event.id.toString(),
  }));
}

export async function GET() {
  let events: Event[] = normaliseEvents(eventsData as unknown as Event[]);
  let dailyEventIds: string[] = [];
  let lastUpdated: string | null = null;
  const selectedFor = todayString();

  try {
    const supabase = getSupabaseClient();

    const { data: supabaseEvents, error: eventsError } = await supabase
      .from("events")
      .select("id, name, year, emoji")
      .order("name", { ascending: true });

    if (!eventsError && supabaseEvents && supabaseEvents.length > 0) {
      events = normaliseEvents(supabaseEvents as unknown as Event[]);
    }

    const { data: selectionRow, error: selectionError } = await supabase
      .from("daily_event_selection")
      .select("id, event_ids, updated_at")
      .eq("id", selectedFor)
      .maybeSingle();

    const row = selectionRow as DailySelectionRow | null;

    if (!selectionError && row?.event_ids) {
      dailyEventIds = row.event_ids.map((id: string | number) => id.toString());
      lastUpdated = row.updated_at ?? null;
    }
  } catch (error) {
    console.warn("Failed to fetch daily events from Supabase", error);
  }

  return NextResponse.json({
    events,
    dailyEventIds,
    lastUpdated,
    selectedFor,
  });
}

export async function PUT(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const payload = await request.json();
    const eventIds: unknown = payload.eventIds;
    const selectedFor = (payload.selectedFor as string | undefined) ?? todayString();

    if (!Array.isArray(eventIds)) {
      return NextResponse.json({ error: "eventIds must be an array" }, { status: 400 });
    }

    const normalisedIds = eventIds.map((id) => id.toString());

    if (normalisedIds.length > 5) {
      return NextResponse.json({ error: "Select at most 5 events" }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();

    const { error } = await supabase.from("daily_event_selection").upsert(
      {
        id: selectedFor,
        event_ids: normalisedIds,
        updated_at: updatedAt,
      },
      { onConflict: "id" }
    );

    if (error) {
      console.error("Failed to update daily event selection", error.message);
      return NextResponse.json({ error: "Failed to update daily selection" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      eventIds: normalisedIds,
      updatedAt,
      selectedFor,
    });
  } catch (error) {
    console.error("Unexpected daily selection error", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
