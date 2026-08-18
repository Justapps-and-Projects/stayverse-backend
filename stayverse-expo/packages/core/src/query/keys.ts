import type { CatalogServiceType } from "../api/catalog/types";

/** Shared query key factory — extend as feature endpoints land. */
export const queryKeys = {
  health: ["health"] as const,
  me: ["me"] as const,
  home: {
    all: ["home"] as const,
    recommendations: (kind: CatalogServiceType) =>
      ["home", "recommendations", kind] as const,
    newest: (kind: CatalogServiceType) => ["home", "newest", kind] as const,
    apartments: () => ["home", "recommendations", "apartment"] as const,
    rides: () => ["home", "recommendations", "ride"] as const,
    chefs: () => ["home", "recommendations", "chef"] as const,
  },
  search: (filters: Record<string, unknown>) => ["search", filters] as const,
  apartment: (id: string) => ["apartment", id] as const,
  ride: (id: string) => ["ride", id] as const,
  chef: (id: string) => ["chef", id] as const,
  bookings: (filter: string) => ["bookings", filter] as const,
  agentBookings: (filter: string) => ["agentBookings", filter] as const,
  unavailableDates: (kind: string, id: string) =>
    ["booking", "unavailable", kind, id] as const,
  favourites: (kind: CatalogServiceType) => ["favourites", kind] as const,
  profile: ["profile"] as const,
  wallet: ["wallet"] as const,
  transactions: ["wallet", "transactions"] as const,
  banks: ["banks"] as const,
  overview: ["overview"] as const,
  listedApartments: (status: string) => ["listed", "apartments", status] as const,
  listedRides: (status: string) => ["listed", "rides", status] as const,
  reviews: (targetId: string) => ["reviews", targetId] as const,
  liveLocation: ["realtime", "liveLocation"] as const,
  chatPing: ["realtime", "chatPing"] as const,
};
