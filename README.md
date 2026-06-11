# CrowdVote AI - 2026 FIFA World Cup Predictions 🏆

> **The Pivot**: This project originally started as **CrowdVote AI - Kerala Election Swarm Intelligence**, a real-time predictive analytics dashboard built to crowdsource predictions for the 140 constituencies of the 2026 Kerala Assembly Elections. The database and backend were seeded with master CSV data, historical margins, and complex constituency logic. 
> 
> The project has now successfully **pivoted** to a **2026 FIFA World Cup Predictions** platform. All local election data was systematically wiped, and the database architecture was refactored to support time-sensitive global sporting events. 

## 🌍 What is it now?

**CrowdVote AI** is now a high-octane prediction market for the **2026 FIFA World Cup**. Users can log in, view upcoming matches, and lock in their predictions for match outcomes, goalscorers, and Player of the Match selections.

### ✨ Key Features
- **Time-Locked Predictions**: A server-side mechanism powered by Firebase Admin ensures that voting for a match strictly locks the exact minute the match kicks off (e.g., IST kick-off times).
- **Dynamic Polling Engine**: Polls are dynamically generated from the backend (`polls.json`) ensuring the frontend always reacts in real-time to the current phase of the tournament.
- **Cyberpunk UI & UX**: Retains the original high-tech, glassmorphism aesthetics with dynamic interactive poll cards, progress bars, and glowing neon accents.
- **Node.js/Express Backend**: Replaces arbitrary frontend Firestore mutations with a secure, dedicated Express REST API built right into Vite.

## 📦 File Layout
- `server-dev.ts` & `server.ts` - Master backend Express modules handling all REST endpoints (`/api/polls`, `/api/vote`).
- `server/data/polls.json` - The core database of World Cup matches, complete with locking timestamps and granular questions.
- `scripts/` - Contains powerful Firebase migration scripts (like `wipe_and_seed.ts` and `rearrange_predictions.ts`) used to execute the pivot and wipe old data.

## 🛠 Prerequisites
- **Node.js (v18+)**
- A valid Firebase Project with Firestore and Authentication enabled.
- Your Firebase `serviceAccountKey.json` placed at the root of the project directory.

## 🚦 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Verify Configuration**
   Check that you have a `.env` file containing your valid Firebase credentials, as well as the `serviceAccountKey.json`.

3. **Spin Up the Matrix**
   ```bash
   npm run dev
   ```
   *This fires up both the Vite client server and the Express backend simultaneously on http://localhost:3000.*

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 📈 Analytics & Leaderboards
*Coming Soon!* As predictions lock and real-world 2026 World Cup matches conclude, the backend will sync real results against user predictions to dynamically calculate Leaderboard standings based on prediction accuracy and confidence scores!
