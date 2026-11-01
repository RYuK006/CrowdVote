export interface User {
  uid: string;
  displayName: string;
  email?: string;
  predictionCount?: number;
  accuracy?: number;
  rank?: number;
  role: "user" | "admin" | "demo_curator";
  createdAt: string;
}

export interface PollOption {
  id: string;
  name?: string;
  text?: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  status: "active" | "closed" | "open";
  category?: string;
  options: PollOption[];
  lockAt?: string;
  matchTime?: string;
  optionScores?: Record<string, number>;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  sponsorReward?: string;
  councilVerdict?: string;
  tags?: string[];
  createdBy?: string;
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
