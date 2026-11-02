export interface User {
  uid: string;
  displayName: string;
  email?: string;
  predictionCount?: number;
  accuracy?: number;
  rank?: number;
  role: "user" | "admin" | "demo_curator";
  createdAt: string;
  bio?: string;
  avatar?: string;
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
  status: "active" | "closed" | "open" | "pending_approval" | "rejected";
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
  createdByName?: string;
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

export interface SocialProfile {
  followersCount: number;
  followingCount: number;
  friendsCount: number;
  isFollowing?: boolean;
  isFollowedBy?: boolean;
  isFriend?: boolean;
  friendRequestStatus?: "none" | "pending_sent" | "pending_received" | "accepted";
}

export interface FriendRequest {
  id: string;
  fromUid: string;
  fromName: string;
  fromEmail?: string;
  toUid: string;
  toName: string;
  status: "pending" | "accepted" | "declined";
  createdAt: string;
}

export interface FollowUser {
  uid: string;
  displayName: string;
  email?: string;
  accuracy?: number;
  avatar?: string;
  isFollowing?: boolean;
  isFriend?: boolean;
  followedAt?: string;
}
