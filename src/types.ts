export interface User {
  uid: string;
  displayName: string;
  predictionCount?: number;
  accuracy?: number;
  rank?: number;
  role: "user" | "admin";
  createdAt: string;
}

export interface PollOption {
  id: string;
  name: string;
  text?: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  status: "active" | "closed";
  category?: string;
  options: PollOption[];
  lockAt?: string;
  matchTime?: string;
}

export interface Vote {
  userId: string;
  pollId: string;
  selectedOption: string;
  confidence: number;
  timestamp: string;
}

export interface GlobalConfig {
  phase: string;
}
