import { NextResponse } from "next/server";
import { getDailyEvents } from "@/lib/utils";
import eventsData from "@/data/events.json";

export async function GET(request: Request) {
  const today = new Date();

  // Check if admin has selected specific daily events
  const { searchParams } = new URL(request.url);
  const checkAdmin = searchParams.get('checkAdmin');

  if (checkAdmin) {
    // This will be called from client-side with localStorage access
    // For now, just return all events and let client handle it
    return NextResponse.json({
      date: today.toISOString().split('T')[0],
      events: eventsData,
      allEvents: true,
    });
  }

  // Default behavior: use date-based rotation
  const dailyEvents = getDailyEvents(eventsData, today);

  return NextResponse.json({
    date: today.toISOString().split('T')[0],
    events: dailyEvents,
  });
}
