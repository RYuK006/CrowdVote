# CrowdVote AI - Kerala Election Swarm Intelligence (2026)

**CrowdVote AI** is a real-time predictive analytics and swarm intelligence platform built for the 2026 Kerala Assembly Elections. This repository leverages a production-grade Node.js/Express backend that consumes real constituency datasets (driven by Firebase Admin for predictions) and integrates it with a cutting-edge React frontend dashboard.

## 🚀 Key Architectural Upgrades
- **Integrated Express Backend**: A dedicated NodeJS REST API built into Vite (`server.ts`) streams real 2026 candidate matrices, 2021 historical margins, and demographics straight from a curated CSV `master_data.csv`. Mock code has been fully eradicated.
- **Firebase Admin Integration**: The API seamlessly interacts with Firebase using `firebase-admin`, executing server-side logic for prediction locks, validation, and analytics telemetry to replace arbitrary frontend Firestore calls.
- **Neural UI & UX**: Retained the high-octane cyberpunk Glassmorphism aesthetics with completely redesigned, independently scrollable Grid & Details panels to enhance user focus during node interaction. No confusing candidate image spaces—streamlined UI relies entirely on precise Party Symbol mapping.
- **Leaderboard & Weight-based Analytics**: `Analytics` and `Leaderboard` now depend on real aggregated node telemetry pulled directly from backend endpoints reflecting swarm movement and conviction levels.

## 📦 File Layout
- `server.ts` - Master backend Express module. Parses the CSV data on load and exposes REST APIs (`/api/constituencies`, `/api/predict`, etc.).
- `server/data/master_data.csv` - The source of truth for all 140 constituencies.
- `serviceAccountKey.json` - Firebase Admin configuration required to read/write from your datastore securely.

## 🛠 Prerequisites
You need **Node.js (v18+)** installed to run the backend and frontend simultaneously. 

Ensure you have your Firebase `serviceAccountKey.json` placed at the root of the project dir!

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

## 📈 Analytics & Swarm Vectors 
Points (`predictabilityScore`) govern your ranking inside the Elite Swarm leaderboard. Start at 0, sync your neural vectors with real predictions, and ascend the ranks!
