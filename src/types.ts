export interface User {
  uid: string;
  displayName: string;
  influencePoints: number;
  predictabilityScore: number;
  accuracy: number;
  rank: number;
  role: "user" | "admin";
  createdAt: string;
}

export interface Prediction {
  userId: string;
  constituencyId: string;
  predictedParty: string;
  confidence: number;
  margin: number;
  timestamp: string;
  phase: string;
}

export interface GlobalConfig {
  phase: "Pre-Campaign" | "Campaign" | "Polling" | "Counting";
}
