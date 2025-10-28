# WhenWasIt - Historical Events Game 🎮

A mobile-friendly web game where players guess when historical events happened.

## Features

- 🎯 **Daily Challenges**: Same 5 events for all players each day
- 📊 **Smart Scoring**: 100 points for exact match, -1 point per year off
- 📱 **Mobile-First Design**: Optimized for phones and tablets
- 🏆 **Leaderboard**: Track and compare scores
- 🔧 **Admin Panel**: Easy event management
- 📤 **Share Results**: Copy formatted scores with emojis

## Getting Started

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
npm start
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Or connect your GitHub repo to Vercel for automatic deployments.

## Usage

### Playing the Game
1. Visit the home page
2. For each event, guess the year and select AD or BC
3. Guesses must be within 200 years of the actual date
4. Complete all 5 events to see your score
5. Share your results with friends!

### Admin Panel
Visit `/admin` to manage events:
- Add new events (name, year, emoji)
- Edit existing events
- Delete events
- Export/Import JSON

**Note**: Use negative years for BC dates (e.g., `-44` for 44 BC)

### Event Data Structure
```json
{
  "id": "1",
  "name": "Event Name",
  "year": 1969,
  "emoji": "🌕"
}
```

## Current Sample Events

1. 🎨 Pablo Picasso born (1881)
2. ⚔️ Julius Caesar assassinated (44 BC)
3. 🌕 First moon landing (1969)
4. 🧱 Fall of the Berlin Wall (1989)
5. 📜 Declaration of Independence signed (1776)

## Tech Stack

- **Framework**: Next.js 16
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Deployment**: Vercel-ready

## Future Enhancements

- Database integration for persistent leaderboard (Vercel Postgres)
- User authentication
- Multiple difficulty levels
- Weekly/monthly challenges
- Social sharing with images

## License

ISC
