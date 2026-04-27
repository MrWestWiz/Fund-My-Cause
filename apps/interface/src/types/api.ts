/**
 * API Response types for Fund-My-Cause
 * Comprehensive type definitions for all API interactions
 */

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

/**
 * API error response
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Campaign list response
 */
export interface CampaignListResponse {
  campaigns: CampaignResponse[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Campaign detail response
 */
export interface CampaignResponse {
  id: string;
  contractId: string;
  title: string;
  description: string;
  creator: string;
  image?: string;
  raised: number;
  goal: number;
  deadline: string;
  status: "Active" | "Successful" | "Refunded" | "Cancelled" | "Paused";
  token: string;
  minContribution: number;
  contributorCount: number;
  averageContribution: number;
  largestContribution: number;
  socialLinks?: string[];
  platformFeeBps?: number;
  platformAddress?: string;
  videoUrl?: string;
  category?: string;
  faqs?: FAQResponse[];
  teamMembers?: TeamMemberResponse[];
  milestones?: MilestoneResponse[];
  createdAt: string;
  updatedAt: string;
}

/**
 * FAQ response
 */
export interface FAQResponse {
  id: string;
  question: string;
  answer: string;
}

/**
 * Team member response
 */
export interface TeamMemberResponse {
  id: string;
  name: string;
  role: string;
  bio?: string;
  avatarUrl?: string;
  profileUrl?: string;
}

/**
 * Milestone response
 */
export interface MilestoneResponse {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  status: "pending" | "achieved" | "failed";
  dueDate?: string;
}

/**
 * Contribution response
 */
export interface ContributionResponse {
  id: string;
  campaignId: string;
  contributor: string;
  amount: number;
  token: string;
  timestamp: string;
  transactionHash: string;
  status: "pending" | "confirmed" | "failed";
}

/**
 * User profile response
 */
export interface UserProfileResponse {
  address: string;
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  createdCampaigns: number;
  totalContributed: number;
  joinedAt: string;
  isVerified: boolean;
}

/**
 * Transaction response
 */
export interface TransactionResponse {
  id: string;
  hash: string;
  type: "contribute" | "withdraw" | "refund" | "initialize";
  campaignId: string;
  amount?: number;
  status: "pending" | "confirmed" | "failed";
  timestamp: string;
  error?: string;
}

/**
 * Wallet balance response
 */
export interface WalletBalanceResponse {
  address: string;
  xlmBalance: number;
  tokenBalances: Record<string, number>;
  lastUpdated: string;
}

/**
 * Search response
 */
export interface SearchResponse {
  campaigns: CampaignResponse[];
  users: UserProfileResponse[];
  total: number;
}

/**
 * Statistics response
 */
export interface StatisticsResponse {
  totalCampaigns: number;
  activeCampaigns: number;
  totalRaised: number;
  totalContributors: number;
  averageFundingPercentage: number;
  successRate: number;
}

/**
 * Notification response
 */
export interface NotificationResponse {
  id: string;
  type: "campaign_update" | "contribution_received" | "goal_reached" | "campaign_ended";
  title: string;
  message: string;
  campaignId?: string;
  read: boolean;
  createdAt: string;
}

/**
 * Comment response
 */
export interface CommentResponse {
  id: string;
  campaignId: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  replies?: CommentResponse[];
}

/**
 * Activity feed response
 */
export interface ActivityFeedResponse {
  id: string;
  type: "contribution" | "campaign_created" | "milestone_reached" | "campaign_ended";
  actor: string;
  campaignId: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
