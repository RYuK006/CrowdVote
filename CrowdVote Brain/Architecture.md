# Architecture Overview

## Backend
- **Node.js/Express**: Core API server.
- **CSV Data Source**: `master_data.csv` is the primary source of truth for constituency data.
- **Data Structure**: Constituencies are objects with `id`, `name`, `state`, and `district`.
- **API Endpoints**: 
  - `GET /api/constituencies`: Returns all constituencies across India.
  - `GET /api/constituencies/:id`: Details for a specific area.
  - `POST /api/predict`: Synchronizes user predictions with the backend/database.

## Frontend
- **React (Vite)**: Modern, responsive frontend.
- **Framer Motion**: Smooth animations and transitions between selection layers.
- **Lucide Icons**: Simple, recognizable visual cues (e.g., MapPin, Lock, Vote).
- **State Selection Layer**: Implemented in `Arena.tsx` as the first entry point for users.
- **Firebase Auth**: User authentication securely handled via Firebase.

## Design System
- **Dark Mode**: Sleek, neutral-950 background with emerald-500 accents.
- **Simplified Terminology**: Language designed for common people, avoiding technical jargon.

## Connected Notes
- [[Project Overview]]
- [[Nationwide Expansion]]
- [[Roadmap]]
