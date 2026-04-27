/**
 * Central export for all application types.
 * Consolidates types from Campaign, Soroban contract, API responses, components, and utilities.
 */

// Campaign types
export type { Campaign, FAQ, TeamMember, TrustSignalData } from "./campaign";

// Soroban contract types
export type {
  CampaignStatus,
  CampaignInfo,
  CampaignStats,
  PlatformConfig,
  StatusVariant,
  ContributionRecord,
  InitializeParams,
  CampaignData,
} from "./soroban";

// Contract types
export type { SignFn } from "./contract";
export { ContractError } from "./contract";

// Comment types
export type { Comment } from "./comment";

// Milestone types
export type { Milestone } from "./milestone";

// API response types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  CampaignListResponse,
  CampaignResponse,
  FAQResponse,
  TeamMemberResponse,
  MilestoneResponse,
  ContributionResponse,
  UserProfileResponse,
  TransactionResponse,
  WalletBalanceResponse,
  SearchResponse,
  StatisticsResponse,
  NotificationResponse,
  CommentResponse,
  ActivityFeedResponse,
} from "./api";

// Component prop types
export type {
  ModalProps,
  ButtonProps,
  InputProps,
  CardProps,
  ProgressBarProps,
  CampaignCardProps,
  PledgeModalProps,
  CountdownTimerProps,
  ShareModalProps,
  TransactionStatusProps,
  NavbarProps,
  LoadingSkeletonProps,
  EmptyStateProps,
  ErrorBoundaryProps,
  ToastProps,
  CommentSectionProps,
  ActivityFeedProps,
  ContributionLeaderboardProps,
  FAQAccordionProps,
  TeamMemberCardProps,
  WalletBalanceProps,
  NotificationDropdownProps,
  MilestoneDisplayProps,
  TrustSignalsProps,
  MilestoneInputProps,
  CampaignPreviewProps,
  EmbedCodeGeneratorProps,
  VideoPlayerProps,
} from "./components";

// Utility and hook types
export type {
  WalletContextType,
  ThemeContextType,
  NotificationContextType,
  BookmarkContextType,
  ComparisonContextType,
  UseCampaignReturn,
  UseCampaignsReturn,
  UseWalletBalanceReturn,
  UseContributionsReturn,
  UseTransactionsReturn,
  Notification,
  ErrorLog,
  ValidationResult,
  FormState,
  AsyncState,
  PaginationState,
  FilterState,
  SortOption,
  CacheEntry,
  ApiRequestConfig,
  ApiResponseConfig,
  RetryPolicy,
  RateLimitInfo,
} from "./utils";
