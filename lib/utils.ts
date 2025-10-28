import { Event, GameResult } from "@/types";

export function calculateScore(guessedYear: number, actualYear: number): number {
  const difference = Math.abs(guessedYear - actualYear);
  const score = Math.max(0, 100 - difference);
  return score;
}

export function getDailyEvents(allEvents: Event[], date: Date): Event[] {
  // Use date as seed for consistent daily events
  const dateStr = date.toISOString().split('T')[0];
  const seed = dateStr.split('-').reduce((acc, val) => acc + parseInt(val), 0);

  // Shuffle events based on seed
  const shuffled = [...allEvents].sort((a, b) => {
    const hashA = (parseInt(a.id) + seed) % allEvents.length;
    const hashB = (parseInt(b.id) + seed) % allEvents.length;
    return hashA - hashB;
  });

  // Return first 5 events
  return shuffled.slice(0, 5);
}

export function formatShareText(results: GameResult[], siteUrl: string): string {
  const totalScore = results.reduce((sum, r) => sum + r.score, 0);
  const scoresWithEmojis = results.map(r => `${r.score} ${r.emoji}`).join(', ');
  return `WhenWasIt ${totalScore}/500\n${scoresWithEmojis}\n${siteUrl}`;
}

export function getYearRange(actualYear: number): { min: number; max: number } {
  return {
    min: actualYear - 200,
    max: actualYear + 200
  };
}
