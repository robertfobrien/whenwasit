import { NextResponse } from "next/server";

// This is a simple in-memory leaderboard
// For production, you'd use a database like Vercel Postgres
let leaderboard: any[] = [];

export async function GET() {
  // Sort by total score descending
  const sorted = [...leaderboard].sort((a, b) => b.totalScore - a.totalScore);
  return NextResponse.json(sorted.slice(0, 100)); // Top 100
}

export async function POST(request: Request) {
  const entry = await request.json();
  leaderboard.push(entry);
  return NextResponse.json({ success: true });
}
