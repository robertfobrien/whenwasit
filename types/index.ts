export interface Event {
  id: string;
  name: string;
  year: number; // Positive for AD, negative for BC
  emoji: string;
}

export interface GameResult {
  eventId: string;
  guessedYear: number;
  actualYear: number;
  score: number;
  emoji: string;
  timeSpent: number; // seconds
}

export interface DailyGame {
  date: string; // YYYY-MM-DD format
  events: Event[];
}

export interface LeaderboardEntry {
  name: string;
  totalScore: number;
  date: string;
  results: GameResult[];
  isPotentialCheater?: boolean;
}
