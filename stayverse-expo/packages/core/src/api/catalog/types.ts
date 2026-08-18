export type CatalogServiceType = "apartment" | "ride" | "chef";

export type ListingSummary = {
  id: string;
  kind: CatalogServiceType;
  title: string;
  subtitle?: string | null;
  price?: number | null;
  priceSuffix?: string | null;
  imageUrl?: string | null;
  profileImageUrl?: string | null;
  /** GeoJSON location.coordinates → [lng, lat]. */
  latitude?: number | null;
  longitude?: number | null;
};

export type ListingHost = {
  /** Agent profile id — Stream Chat peer id. */
  id: string | null;
  name: string;
  avatarUrl: string | null;
  phone: string | null;
};

/** Full detail payload for apartment / ride / chef screens. */
export type ListingDetails = ListingSummary & {
  description: string | null;
  address: string | null;
  images: string[];
  amenities: string[];
  rules: string | null;
  averageRating: number | null;
  isFavourite: boolean;
  cautionFee?: number | null;
  bedrooms?: number | null;
  maxGuests?: number | null;
  checkIn?: string | null;
  checkOut?: string | null;
  maxPassengers?: number | null;
  color?: string | null;
  plateNumber?: string | null;
  about?: string | null;
  experiences?: Array<{
    title: string | null;
    company: string | null;
    description: string | null;
  }>;
  featuredImages?: string[];
  certifications?: Array<{ name: string | null; issuer: string | null }>;
  host?: ListingHost | null;
};

export type BookingSummary = {
  id: string;
  status: string;
  serviceType: CatalogServiceType;
  listingId: string;
  title: string;
  address: string;
  description: string;
  imageUrl: string | null;
  totalPrice?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  /** Agent Stream id (for user chat from booking). */
  agentId?: string | null;
  guestName?: string | null;
  guestPhone?: string | null;
};

export type ReviewSummary = {
  id: string;
  rating: number;
  review: string | null;
  authorName: string | null;
  authorAvatar: string | null;
  createdAt: string | null;
};

export type BookingsPageResult = {
  items: BookingSummary[];
  page: number;
  hasNextPage: boolean;
};

export type ProfilePayload = {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  notificationsEnabled?: boolean | null;
};

export type WalletPayload = {
  balance: number;
  currency: string;
};

export type TransactionType = "credit" | "debit";

export type TransactionStatus =
  | "successful"
  | "pending"
  | "failed"
  | "refunded"
  | "reversed";

export type TransactionSummary = {
  id: string;
  reference: string | null;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  createdAt: string | null;
};

export type TransactionsPageResult = {
  items: TransactionSummary[];
  page: number;
  hasNextPage: boolean;
};

export type FundWalletResult = {
  authorizationUrl: string;
  reference: string;
  accessCode: string | null;
};

export type CreateApartmentBookingInput = {
  apartmentId: string;
  startDate: string;
  endDate: string;
  /** Flutter API typo — keep for parity. */
  totalAmout: number;
};

export type CreateRideBookingInput = {
  rideId: string;
  startDate: string;
  pickupPlaceId: string | null;
  totalHours: number;
  notes: string;
  securityDetails: string[];
};

export type MetricPeriodCounts = {
  week: number;
  month: number;
  year: number;
};

/** Flutter `OverviewData` from `GET /agents/metrics/:agentId`. */
export type AgentOverviewData = {
  earnings: MetricPeriodCounts;
  bookings: MetricPeriodCounts;
  favorites: MetricPeriodCounts;
  request: MetricPeriodCounts;
};

export type ListingOwnerStatus = "pending" | "approved" | "cancelled";

export type OverviewPeriod = "week" | "month" | "year";

