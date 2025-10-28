import { NextResponse } from "next/server";
import { getDailyEvents } from "@/lib/utils";
import eventsData from "@/data/events.json";

export async function GET() {
  const today = new Date();
  const dailyEvents = getDailyEvents(eventsData, today);

  return NextResponse.json({
    date: today.toISOString().split('T')[0],
    events: dailyEvents,
  });
}
