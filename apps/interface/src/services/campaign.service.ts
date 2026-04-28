/**
 * Campaign service — pure business logic for campaign data.
 * No React, no UI imports. Safe to use in tests and server contexts.
 */

import type { Campaign } from "@/types/campaign";

export type FilterTab = "all" | "active" | "funded" | "ended";
export type SortOption = "newest" | "most-funded" | "ending-soon";

// ── Status ────────────────────────────────────────────────────────────────────

export function getCampaignStatus(c: Campaign): FilterTab {
  if (c.raised >= c.goal) return "funded";
  if (new Date(c.deadline) < new Date()) return "ended";
  return "active";
}

export function getCampaignProgress(c: Campaign): number {
  return c.goal > 0 ? Math.min(100, (c.raised / c.goal) * 100) : 0;
}

// ── Filter / sort / search ────────────────────────────────────────────────────

export function filterCampaigns(
  campaigns: Campaign[],
  filter: FilterTab,
): Campaign[] {
  if (filter === "all") return campaigns;
  return campaigns.filter((c) => getCampaignStatus(c) === filter);
}

export function sortCampaigns(
  campaigns: Campaign[],
  sort: SortOption,
): Campaign[] {
  return [...campaigns].sort((a, b) => {
    if (sort === "most-funded") return b.raised / b.goal - a.raised / a.goal;
    if (sort === "ending-soon")
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    // newest: fallback to id desc
    return Number(b.id) - Number(a.id);
  });
}

export function searchCampaigns(
  campaigns: Campaign[],
  query: string,
): Campaign[] {
  if (!query) return campaigns;
  const q = query.toLowerCase();
  return campaigns.filter(
    (c) =>
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.creator.toLowerCase().includes(q),
  );
}

/** Convenience: search → filter → sort → paginate */
export function queryCampaigns(
  campaigns: Campaign[],
  opts: {
    query?: string;
    filter?: FilterTab;
    sort?: SortOption;
    page?: number;
    pageSize?: number;
  },
): { results: Campaign[]; total: number; totalPages: number } {
  const {
    query = "",
    filter = "all",
    sort = "newest",
    page = 1,
    pageSize = 9,
  } = opts;
  const searched = searchCampaigns(campaigns, query);
  const filtered = filterCampaigns(searched, filter);
  const sorted = sortCampaigns(filtered, sort);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const results = sorted.slice((page - 1) * pageSize, page * pageSize);
  return { results, total, totalPages };
}
