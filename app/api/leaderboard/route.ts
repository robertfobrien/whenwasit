import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("leaderboard_entries")
      .select("name, total_score, played_at, results, is_potential_cheater")
      .order("total_score", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Failed to load leaderboard", error.message);
      return NextResponse.json(
        { error: "Failed to load leaderboard" },
        { status: 500 }
      );
    }

    const entries = (data || []).map((entry) => ({
      name: entry.name ?? "Anonymous",
      totalScore: entry.total_score ?? 0,
      date: entry.played_at ?? new Date().toISOString(),
      results: entry.results ?? [],
      isPotentialCheater: entry.is_potential_cheater ?? false,
    }));

    return NextResponse.json(entries);
  } catch (err) {
    console.error("Unexpected leaderboard error", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const supabase = getSupabaseClient();
    const { error } = await supabase.from("leaderboard_entries").insert({
      name: payload.name ?? "Anonymous",
      total_score: payload.totalScore ?? 0,
      played_at: payload.date ?? new Date().toISOString(),
      results: payload.results ?? [],
      is_potential_cheater: payload.isPotentialCheater ?? false,
    });

    if (error) {
      console.error("Failed to store leaderboard entry", error.message);
      return NextResponse.json(
        { error: "Failed to store leaderboard entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Unexpected leaderboard insert error", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
