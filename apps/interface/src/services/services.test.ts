import {
  getCampaignStatus,
  getCampaignProgress,
  filterCampaigns,
  sortCampaigns,
  searchCampaigns,
  queryCampaigns,
} from "@/services/campaign.service";
import {
  saveSession,
  loadSession,
  clearSession,
  isNetworkMatch,
  classifySignError,
} from "@/services/wallet.service";
import type { Campaign } from "@/types/campaign";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const future = new Date(Date.now() + 86400_000).toISOString();
const past = new Date(Date.now() - 86400_000).toISOString();

const base: Omit<Campaign, "id" | "raised" | "goal" | "deadline" | "status"> = {
  contractId: "C1",
  title: "Test Campaign",
  description: "A test",
  creator: "GABC",
  token: "XLM",
  image: "https://example.com/img.jpg",
};

const active: Campaign = {
  ...base,
  id: "1",
  raised: 500,
  goal: 1000,
  deadline: future,
  status: "Active",
};
const funded: Campaign = {
  ...base,
  id: "2",
  raised: 1000,
  goal: 1000,
  deadline: future,
  status: "Successful",
};
const ended: Campaign = {
  ...base,
  id: "3",
  raised: 200,
  goal: 1000,
  deadline: past,
  status: "Active",
};

const campaigns = [active, funded, ended];

// ── campaign.service ──────────────────────────────────────────────────────────

describe("getCampaignStatus", () => {
  it("returns funded when raised >= goal", () => {
    expect(getCampaignStatus(funded)).toBe("funded");
  });
  it("returns ended when deadline passed and not funded", () => {
    expect(getCampaignStatus(ended)).toBe("ended");
  });
  it("returns active otherwise", () => {
    expect(getCampaignStatus(active)).toBe("active");
  });
});

describe("getCampaignProgress", () => {
  it("returns correct percentage", () => {
    expect(getCampaignProgress(active)).toBe(50);
  });
  it("caps at 100", () => {
    expect(getCampaignProgress(funded)).toBe(100);
  });
  it("returns 0 for zero goal", () => {
    expect(getCampaignProgress({ ...active, goal: 0 })).toBe(0);
  });
});

describe("filterCampaigns", () => {
  it("all returns everything", () => {
    expect(filterCampaigns(campaigns, "all")).toHaveLength(3);
  });
  it("active filters correctly", () => {
    expect(filterCampaigns(campaigns, "active")).toEqual([active]);
  });
  it("funded filters correctly", () => {
    expect(filterCampaigns(campaigns, "funded")).toEqual([funded]);
  });
  it("ended filters correctly", () => {
    expect(filterCampaigns(campaigns, "ended")).toEqual([ended]);
  });
});

describe("sortCampaigns", () => {
  it("most-funded sorts by progress desc", () => {
    const sorted = sortCampaigns(campaigns, "most-funded");
    expect(sorted[0].id).toBe("2"); // 100%
  });
  it("ending-soon sorts by deadline asc", () => {
    const sorted = sortCampaigns(campaigns, "ending-soon");
    expect(sorted[0].id).toBe("3"); // past deadline first
  });
  it("newest sorts by id desc", () => {
    const sorted = sortCampaigns(campaigns, "newest");
    expect(sorted[0].id).toBe("3");
  });
});

describe("searchCampaigns", () => {
  const c1: Campaign = {
    ...active,
    id: "10",
    title: "Solar Power",
    description: "Energy",
    creator: "GABC",
  };
  const c2: Campaign = {
    ...active,
    id: "11",
    title: "Water Filter",
    description: "Clean water",
    creator: "GXYZ",
  };

  it("matches title", () => {
    expect(searchCampaigns([c1, c2], "solar")).toEqual([c1]);
  });
  it("matches description", () => {
    expect(searchCampaigns([c1, c2], "clean")).toEqual([c2]);
  });
  it("matches creator", () => {
    expect(searchCampaigns([c1, c2], "GXYZ")).toEqual([c2]);
  });
  it("empty query returns all", () => {
    expect(searchCampaigns([c1, c2], "")).toHaveLength(2);
  });
});

describe("queryCampaigns", () => {
  it("paginates correctly", () => {
    const many = Array.from({ length: 20 }, (_, i) => ({
      ...active,
      id: String(i),
    }));
    const { results, total, totalPages } = queryCampaigns(many, {
      pageSize: 9,
      page: 2,
    });
    expect(total).toBe(20);
    expect(totalPages).toBe(3);
    expect(results).toHaveLength(9);
  });
});

// ── wallet.service ────────────────────────────────────────────────────────────

describe("session helpers", () => {
  beforeEach(() => sessionStorage.clear());

  it("saves and loads a session", () => {
    saveSession("GABC", "freighter");
    expect(loadSession()).toEqual({ address: "GABC", walletType: "freighter" });
  });

  it("returns null when no session", () => {
    expect(loadSession()).toBeNull();
  });

  it("clears session", () => {
    saveSession("GABC", "lobstr");
    clearSession();
    expect(loadSession()).toBeNull();
  });
});

describe("isNetworkMatch", () => {
  it("matches the mock passphrase", () => {
    expect(isNetworkMatch("Test SDF Network ; September 2015")).toBe(true);
  });
  it("rejects a different passphrase", () => {
    expect(
      isNetworkMatch("Public Global Stellar Network ; September 2015"),
    ).toBe(false);
  });
});

describe("classifySignError", () => {
  it("classifies cancellation", () => {
    expect(classifySignError(new Error("User rejected"))).toBe("cancelled");
    expect(classifySignError(new Error("declined by user"))).toBe("cancelled");
  });
  it("classifies network errors", () => {
    expect(classifySignError(new Error("network timeout"))).toBe("network");
    expect(classifySignError(new Error("fetch failed"))).toBe("network");
  });
  it("classifies unknown errors", () => {
    expect(classifySignError(new Error("something else"))).toBe("unknown");
    expect(classifySignError("not an error")).toBe("unknown");
  });
});
