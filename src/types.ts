export type PollFormat = "versus" | "choice" | "scale" | "rank" | "open";

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
  customClaims?: {
    admin?: boolean;
    level?: number;
  };
  isBanned?: boolean;
  isShadowbanned?: boolean;
  verified?: boolean;
}

export interface PollOption {
  id: string;
  name?: string;
  text?: string;
  votes?: number;
  percentage?: number;
  imageUrl?: string;
}

export interface PollVersusSide {
  id: string;
  label: string;
  image?: string;
  votes: number;
  percentage?: number;
}

export interface PollRankItem {
  id: string;
  label: string;
  score: number;
}

export interface PollOpenSubmission {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  votes: number;
  createdAt: string;
}

export interface Poll {
  id: string;
  title: string;
  description?: string;
  status: "active" | "closed" | "open" | "pending_approval" | "rejected";
  category?: string;
  format?: PollFormat;
  blind?: boolean; // Anchoring bias protection: hide percentages until voted
  changeable?: boolean; // Can user change their vote before expiry
  anonymous?: boolean; // Whether voters are audited publicly
  options: PollOption[];
  lockAt?: string;
  matchTime?: string;
  optionScores?: Record<string, number>;
  totalVotes?: number;
  isSponsored?: boolean;
  sponsorName?: string;
  sponsorLogo?: string;
  sponsorUrl?: string;
  sponsorReward?: string;
  councilVerdict?: string;
  tags?: string[];
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;

  // Format-specific models
  versusLeft?: PollVersusSide;
  versusRight?: PollVersusSide;
  scaleMin?: number;
  scaleMax?: number;
  scaleUnit?: string;
  scaleAverage?: number;
  scaleVotesCount?: number;
  rankedItems?: PollRankItem[];
  openSubmissions?: PollOpenSubmission[];

  // Client-injected voting state
  hasVoted?: boolean;
  votedOption?: string | number | string[];
}

export interface Vote {
  userId: string;
  pollId: string;
  selectedOption: string | number | string[]; // choice ID, scale value (number), or ranked order array
  confidence?: number;
  timestamp: string;
  faction?: string;
}

export interface DebateItem {
  id: string;
  pollId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userFaction: string;
  factionId?: string;
  text: string;
  upvotes: number;
  upvotedBy?: string[];
  createdAt: string;
}

export interface GlobalConfig {
  phase: string;
  maintenanceMode?: boolean;
  minAccountAgeDays?: number;
  maxDailyPollsPerUser?: number;
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

export interface AuditLog {
  id: string;
  action: string;
  adminUid: string;
  adminEmail?: string;
  targetId?: string;
  targetType?: string;
  details?: any;
  timestamp: string;
}

export interface ReportItem {
  id: string;
  pollId: string;
  pollTitle: string;
  reason: string;
  reporterUid: string;
  reporterName: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
}

export interface BountyItem {
  id: string;
  pollId: string;
  pollTitle: string;
  sponsorName: string;
  escrowAmount: number;
  rewardDescription: string;
  status: "active" | "funded" | "distributed" | "refunded";
  winnerUid?: string;
  createdAt: string;
}
