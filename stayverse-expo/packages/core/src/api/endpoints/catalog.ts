/**
 * Catalog API — home recommendations, newest listings, search, details.
 */
import { getApiClient } from "../client";
import { ApiError } from "../errors";
import { parseServerResponse } from "../types";
import { mapCatalogList, mapFavouritesList, mapBookingsPage, mapTransactionsPage, mapListingDetails } from "../catalog/mappers";
import { unwrapCatalogData } from "../catalog/listParsers";
import type {
  AgentOverviewData,
  BookingsPageResult,
  CatalogServiceType,
  CreateApartmentBookingInput,
  CreateRideBookingInput,
  FundWalletResult,
  ListingDetails,
  ListingOwnerStatus,
  ListingSummary,
  MetricPeriodCounts,
  TransactionsPageResult,
  WalletPayload,
  ReviewSummary,
} from "../catalog/types";
import type { BookingsFilter } from "../../stores/bookingsUiStore";
import { getEnv } from "../../config/env";
import { mapCurrentUser } from "./auth";
import type { CurrentUser } from "../../types/auth";
import { useAuthStore } from "../../stores/authStore";

export type {
  AgentOverviewData,
  BookingSummary,
  BookingsPageResult,
  CatalogServiceType,
  CreateApartmentBookingInput,
  CreateRideBookingInput,
  FundWalletResult,
  ListingDetails,
  ListingOwnerStatus,
  ListingSummary,
  OverviewPeriod,
  ProfilePayload,
  TransactionStatus,
  TransactionSummary,
  TransactionType,
  TransactionsPageResult,
  WalletPayload,
  ReviewSummary,
} from "../catalog/types";
export type { BookingsFilter } from "../../stores/bookingsUiStore";
export type { CurrentUser } from "../../types/auth";
const HOME_PAGE = { limit: 8, page: 1 } as const;

function makeEmptyList(kind: CatalogServiceType): ListingSummary[] {
  // Ensure `ListingSummary` shape is compatible even when backend is not ported yet.
  return [];
}

async function safeFetchHomeList(
  kind: CatalogServiceType,
  path: string,
): Promise<ListingSummary[]> {
  try {
    const res = await getApiClient().get(path, { params: HOME_PAGE });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return [];

    const payload = unwrapCatalogData(envelope.payload ?? res.data);
    return mapCatalogList(kind, payload);
  } catch {
    return makeEmptyList(kind);
  }
}

/** Flutter `HomeController.getRecommendations` for the active tab. */
export async function fetchCatalogRecommendations(
  kind: CatalogServiceType,
): Promise<ListingSummary[]> {
  return safeFetchHomeList(kind, `/${kind}`);
}

/** Flutter `HomeController.getNewlyListedX` for the active tab. */
export async function fetchCatalogNewest(
  kind: CatalogServiceType,
): Promise<ListingSummary[]> {
  return safeFetchHomeList(kind, `/${kind}/newest`);
}

// Legacy exports used by earlier hooks/components.
export async function fetchHomeApartments(): Promise<ListingSummary[]> {
  return fetchCatalogRecommendations("apartment");
}
export async function fetchHomeRides(): Promise<ListingSummary[]> {
  return fetchCatalogRecommendations("ride");
}
export async function fetchHomeChefs(): Promise<ListingSummary[]> {
  return fetchCatalogRecommendations("chef");
}

/**
 * Nearby listings — `GET /{apartment|ride|chef}/recommended?lat=&lng=`.
 * Falls back to the unfiltered home feed when coords fail or the area is empty.
 */
export async function fetchNearbyListings(
  kind: CatalogServiceType,
  coords: { latitude: number; longitude: number },
): Promise<ListingSummary[]> {
  try {
    const res = await getApiClient().get(`/${kind}/recommended`, {
      params: {
        lat: coords.latitude,
        lng: coords.longitude,
        limit: 8,
        page: 1,
      },
    });
    const envelope = parseServerResponse<unknown>(res.data);
    if (envelope.isSuccess) {
      const payload = unwrapCatalogData(envelope.payload ?? envelope.data ?? res.data);
      const mapped = mapCatalogList(kind, payload);
      if (mapped.length > 0) return mapped;
    }
  } catch {
    // Fall through to the general catalog feed.
  }
  return fetchCatalogRecommendations(kind);
}

/** Flutter search — `GET /{apartment|ride|chef}/search`. */
export async function fetchSearchResults(input: {
  serviceType: CatalogServiceType;
  query?: string;
  city?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  guests?: number;
  bedrooms?: number | null;
  listingType?: string | null;
}): Promise<ListingSummary[]> {
  const path =
    input.serviceType === "apartment"
      ? "/apartment/search"
      : input.serviceType === "ride"
        ? "/ride/search"
        : "/chef/search";
  const params: Record<string, string | number> = {
    limit: 40,
    page: 1,
  };
  const term = input.query?.trim();
  if (term) params.searchTerm = term;
  if (input.minPrice != null) params.minPrice = input.minPrice;
  if (input.maxPrice != null) params.maxPrice = input.maxPrice;
  const bedrooms = input.bedrooms ?? input.guests;
  if (bedrooms != null && input.serviceType === "apartment") {
    params.numberOfBedrooms = bedrooms;
  }
  if (input.listingType) {
    if (input.serviceType === "apartment") {
      params.apartmentType = input.listingType;
    } else if (input.serviceType === "ride") {
      params.rideType = input.listingType;
    }
  }
  try {
    const res = await getApiClient().get(path, { params });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return [];
    const payload = unwrapCatalogData(envelope.data ?? res.data);
    return mapCatalogList(input.serviceType, payload);
  } catch {
    return [];
  }
}

async function fetchListingDetails(
  kind: CatalogServiceType,
  id: string,
): Promise<ListingDetails | null> {
  if (!id) return null;
  try {
    const res = await getApiClient().get(`/${kind}/${id}`);
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return null;
    const payload = unwrapCatalogData(envelope.data ?? res.data);
    return mapListingDetails(kind, payload);
  } catch {
    return null;
  }
}

export async function fetchApartmentDetails(
  id: string,
): Promise<ListingDetails | null> {
  return fetchListingDetails("apartment", id);
}

export async function fetchRideDetails(
  id: string,
): Promise<ListingDetails | null> {
  return fetchListingDetails("ride", id);
}

export async function fetchChefDetails(
  id: string,
): Promise<ListingDetails | null> {
  return fetchListingDetails("chef", id);
}

/** Flutter favourite toggle — both add/remove `POST /favorites`. */
export async function toggleFavourite(input: {
  kind: CatalogServiceType;
  id: string;
}): Promise<void> {
  const body =
    input.kind === "apartment"
      ? { apartmentId: input.id, serviceType: "apartment" }
      : input.kind === "ride"
        ? { rideId: input.id, serviceType: "ride" }
        : { chefId: input.id, serviceType: "chef" };

  const res = await getApiClient().post("/favorites", body);
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

const BOOKINGS_PAGE_SIZE = 10;

/** Flutter `BookingNetworkRepository.getBookings` — `GET /booking/user`. */
export async function fetchBookings(
  status: BookingsFilter,
  page = 1,
): Promise<BookingsPageResult> {
  try {
    const res = await getApiClient().get("/booking/user", {
      params: {
        status,
        page,
        limit: BOOKINGS_PAGE_SIZE,
      },
    });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) {
      return { items: [], page, hasNextPage: false };
    }

    const payload = unwrapCatalogData(envelope.data ?? res.data);
    return mapBookingsPage(payload, page);
  } catch {
    return { items: [], page, hasNextPage: false };
  }
}

/** Flutter agent Discover — `GET /booking/agent`. */
export async function fetchAgentBookings(
  status: BookingsFilter,
  page = 1,
): Promise<BookingsPageResult> {
  try {
    const res = await getApiClient().get("/booking/agent", {
      params: {
        status,
        page,
        limit: BOOKINGS_PAGE_SIZE,
      },
    });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) {
      return { items: [], page, hasNextPage: false };
    }
    const payload = unwrapCatalogData(envelope.data ?? res.data);
    return mapBookingsPage(payload, page);
  } catch {
    return { items: [], page, hasNextPage: false };
  }
}

const FAVOURITES_PAGE = { page: 1, limit: 10 } as const;

/** Flutter `FavouriteNetworkRepository.getFavourite` — `GET /favorites/user`. */
export async function fetchFavourites(
  kind: CatalogServiceType,
): Promise<ListingSummary[]> {
  try {
    const res = await getApiClient().get("/favorites/user", {
      params: {
        serviceType: kind,
        page: FAVOURITES_PAGE.page,
        limit: FAVOURITES_PAGE.limit,
      },
    });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return [];

    const payload = unwrapCatalogData(envelope.data ?? res.data);
    return mapFavouritesList(kind, payload);
  } catch {
    return [];
  }
}

/** Flutter dashboard `GET /users/me` (agent: `/agents/me`). */
export async function fetchProfile(): Promise<CurrentUser | null> {
  try {
    const prefix = getEnv().APP_TARGET === "agent" ? "agents" : "users";
    const res = await getApiClient().get(`/${prefix}/me`);
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return null;
    const user = mapCurrentUser(envelope.data);
    return user.id ? user : null;
  } catch {
    return null;
  }
}

/** Flutter balance from profile — refresh via `fetchProfile`. */
export async function fetchWallet(): Promise<WalletPayload> {
  const user = await fetchProfile();
  return {
    balance: user?.balance ?? 0,
    currency: "NGN",
  };
}

const TRANSACTIONS_PAGE_SIZE = 10;

/** Flutter `WalletNetworkRepository.getTransactions` — `GET /payments`. */
export async function fetchTransactions(
  page = 1,
): Promise<TransactionsPageResult> {
  try {
    const res = await getApiClient().get("/payments", {
      params: { page, limit: TRANSACTIONS_PAGE_SIZE },
    });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) {
      return { items: [], page, hasNextPage: false };
    }
    const payload = unwrapCatalogData(envelope.data ?? res.data);
    return mapTransactionsPage(payload, page);
  } catch {
    return { items: [], page, hasNextPage: false };
  }
}

export async function fetchBanks(): Promise<
  Array<{ id: string; name: string; code: string }>
> {
  try {
    const res = await getApiClient().get("/payments/banks");
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return [];
    const list = Array.isArray(envelope.data)
      ? envelope.data
      : Array.isArray(
            (envelope.data as { data?: unknown } | null)?.data,
          )
        ? ((envelope.data as { data: unknown[] }).data)
        : [];
    return list
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const rec = item as Record<string, unknown>;
        const id = String(rec.id ?? rec.code ?? "");
        const name = String(rec.name ?? "");
        const code = String(rec.code ?? "");
        if (!id || !name || !code) return null;
        return { id, name, code };
      })
      .filter((b): b is { id: string; name: string; code: string } => b != null);
  } catch {
    return [];
  }
}

export type ResolvedBankAccount = {
  accountNumber: string;
  accountName: string;
  bankId: string | null;
};

/** Flutter `POST /payments/resolve-account`. */
export async function resolveBankAccount(input: {
  accountNumber: string;
  bankCode: string;
}): Promise<ResolvedBankAccount> {
  const res = await getApiClient().post("/payments/resolve-account", {
    account_number: input.accountNumber,
    bank_code: input.bankCode,
  });
  const envelope = parseServerResponse<unknown>(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage || "Account Name Not Found",
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
  const data =
    envelope.data && typeof envelope.data === "object"
      ? (envelope.data as Record<string, unknown>)
      : {};
  const accountName = String(data.account_name ?? data.accountName ?? "");
  if (!accountName) {
    throw new ApiError({
      message: "Account Name Not Found",
      code: "RESOLVE_FAILED",
      status: envelope.statusCode,
    });
  }
  return {
    accountNumber: String(
      data.account_number ?? data.accountNumber ?? input.accountNumber,
    ),
    accountName,
    bankId:
      data.bank_id != null || data.bankId != null
        ? String(data.bank_id ?? data.bankId)
        : null,
  };
}

/** Flutter `POST /payments/withdraw`. */
export async function withdrawFunds(input: {
  fullName: string;
  accountNumber: string;
  bankCode: string;
  amount: number;
  password: string;
}): Promise<void> {
  const res = await getApiClient().post("/payments/withdraw", {
    fullName: input.fullName,
    accountNumber: input.accountNumber,
    bankCode: input.bankCode,
    amount: input.amount,
    password: input.password,
  });
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

/** Flutter dashboard `PUT /users/profile` (agent: `/agents/profile`). */
export async function updateProfile(input: {
  firstname: string;
  lastname: string;
}): Promise<CurrentUser | null> {
  const prefix = getEnv().APP_TARGET === "agent" ? "agents" : "users";
  const res = await getApiClient().put(`/${prefix}/profile`, {
    firstname: input.firstname,
    lastname: input.lastname,
  });
  const envelope = parseServerResponse<unknown>(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
  // Prefer fresh /me so local session matches server.
  return fetchProfile();
}

/** Flutter `PUT /users/update-password` (agent: `/agents/update-password`). */
export async function updatePassword(input: {
  oldPassword: string;
  newPassword: string;
}): Promise<void> {
  const prefix = getEnv().APP_TARGET === "agent" ? "agents" : "users";
  const res = await getApiClient().put(`/${prefix}/update-password`, {
    oldPassword: input.oldPassword,
    newPassword: input.newPassword,
  });
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

export type SubmitReviewInput = {
  serviceType: CatalogServiceType;
  serviceId: string;
  rating: number;
  review: string;
};

/** Flutter `GET /{type}/:id/ratings`. */
export async function fetchReviews(
  serviceType: CatalogServiceType,
  serviceId: string,
): Promise<ReviewSummary[]> {
  if (!serviceId) return [];
  try {
    const res = await getApiClient().get(`/${serviceType}/${serviceId}/ratings`, {
      params: { page: 1, limit: 40 },
    });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return [];
    const payload = unwrapCatalogData(envelope.data ?? res.data);
    const root =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : null;
    const nested = root?.reviews ?? root?.data ?? payload;
    const rows = Array.isArray(nested)
      ? nested
      : Array.isArray((root?.data as { reviews?: unknown } | null)?.reviews)
        ? ((root!.data as { reviews: unknown[] }).reviews)
        : [];
    return rows
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const rec = row as Record<string, unknown>;
        const id = String(rec._id ?? rec.id ?? "");
        if (!id) return null;
        const user =
          rec.user && typeof rec.user === "object"
            ? (rec.user as Record<string, unknown>)
            : null;
        const first = user?.firstname != null ? String(user.firstname) : "";
        const last = user?.lastname != null ? String(user.lastname) : "";
        return {
          id,
          rating:
            typeof rec.rating === "number"
              ? rec.rating
              : Number(rec.rating) || 0,
          review:
            rec.review != null
              ? String(rec.review)
              : rec.comment != null
                ? String(rec.comment)
                : null,
          authorName:
            [first, last].filter(Boolean).join(" ") ||
            (user?.fullName != null ? String(user.fullName) : null),
          authorAvatar:
            user?.profilePicture != null ? String(user.profilePicture) : null,
          createdAt:
            rec.createdAt != null
              ? String(rec.createdAt)
              : rec.created_at != null
                ? String(rec.created_at)
                : null,
        } satisfies ReviewSummary;
      })
      .filter((r): r is ReviewSummary => r != null);
  } catch {
    return [];
  }
}

/** Flutter `POST /{type}/:id/rating`. */
export async function submitReview(input: SubmitReviewInput): Promise<void> {
  const res = await getApiClient().post(
    `/${input.serviceType}/${input.serviceId}/rating`,
    { rating: input.rating, review: input.review },
  );
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

/** Flutter `POST /booking/:id/cancel`. */
export async function cancelBooking(bookingId: string): Promise<void> {
  const res = await getApiClient().post(`/booking/${bookingId}/cancel`);
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

/** Flutter agent `PATCH /booking/:id/status`. */
export async function updateBookingStatus(input: {
  bookingId: string;
  status: "accepted" | "rejected" | "completed" | "pending";
}): Promise<void> {
  const res = await getApiClient().patch(`/booking/${input.bookingId}/status`, {
    status: input.status,
  });
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

export type CreateChefProfileInput = {
  fullName: string;
  bio: string;
  about?: string;
  culinarySpecialties: string[];
  pricingPerHour: number;
  address?: string;
  placeId?: string | null;
  coverPhoto?: { uri: string; mimeType?: string | null; fileName?: string | null } | null;
  profilePicture?: { uri: string; mimeType?: string | null; fileName?: string | null } | null;
};

/** Flutter agent condensed `POST /chef`. */
export async function createChefProfile(
  input: CreateChefProfileInput,
): Promise<void> {
  const form = new FormData();
  form.append("fullName", input.fullName);
  form.append("bio", input.bio);
  form.append("about", input.about?.trim() || input.bio);
  form.append("pricingPerHour", String(input.pricingPerHour));
  if (input.address) form.append("address", input.address);
  if (input.placeId) form.append("placeId", input.placeId);
  input.culinarySpecialties.forEach((name, i) => {
    form.append(`culinarySpecialties[${i}]`, name);
  });
  if (input.coverPhoto) {
    appendListingImages(form, "coverPhoto", [input.coverPhoto]);
  }
  if (input.profilePicture) {
    appendListingImages(form, "profilePicture", [input.profilePicture]);
  }
  const res = await getApiClient().post("/chef", form);
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}



function emptyMetricCounts(): MetricPeriodCounts {
  return { week: 0, month: 0, year: 0 };
}

function mapMetricCounts(raw: unknown): MetricPeriodCounts {
  const rec =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const num = (v: unknown) =>
    typeof v === "number" ? v : Number(v) || 0;
  return {
    week: num(rec.week),
    month: num(rec.month),
    year: num(rec.year),
  };
}

/** Flutter `GET /agents/metrics/{agentId}`. */
export async function fetchAgentOverview(): Promise<AgentOverviewData> {
  const empty: AgentOverviewData = {
    earnings: emptyMetricCounts(),
    bookings: emptyMetricCounts(),
    favorites: emptyMetricCounts(),
    request: emptyMetricCounts(),
  };
  try {
    const user = useAuthStore.getState().user;
    const agentId = user?.agentId ?? user?.id;
    if (!agentId) return empty;

    const res = await getApiClient().get(`/agents/metrics/${agentId}`);
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return empty;

    const payload = unwrapCatalogData(envelope.data ?? res.data);
    const root =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};

    return {
      earnings: mapMetricCounts(root.earnings),
      bookings: mapMetricCounts(root.bookings),
      favorites: mapMetricCounts(root.favorites),
      request: mapMetricCounts(root.request),
    };
  } catch {
    return empty;
  }
}

/** Flutter `GET /apartment/owner?status=`. */
export async function fetchListedApartments(
  status: ListingOwnerStatus = "approved",
): Promise<ListingSummary[]> {
  try {
    const res = await getApiClient().get("/apartment/owner", {
      params: { status },
    });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return [];
    const payload = unwrapCatalogData(envelope.data ?? res.data);
    return mapCatalogList("apartment", payload);
  } catch {
    return [];
  }
}

/** Flutter `GET /ride/owner?status=`. */
export async function fetchListedRides(
  status: ListingOwnerStatus = "approved",
): Promise<ListingSummary[]> {
  try {
    const res = await getApiClient().get("/ride/owner", {
      params: { status },
    });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return [];
    const payload = unwrapCatalogData(envelope.data ?? res.data);
    return mapCatalogList("ride", payload);
  } catch {
    return [];
  }
}

/** Flutter `GET /booking/unavailable-dates`. */
export async function fetchUnavailableDates(
  kind: CatalogServiceType,
  id: string,
): Promise<string[]> {
  if (!id) return [];
  try {
    const res = await getApiClient().get("/booking/unavailable-dates", {
      params: { serviceType: kind, id },
    });
    const envelope = parseServerResponse<unknown>(res.data);
    if (!envelope.isSuccess) return [];
    const payload = unwrapCatalogData(envelope.data ?? res.data);
    if (!Array.isArray(payload)) return [];
    return payload
      .map((item) => {
        if (typeof item === "string") return item.slice(0, 10);
        if (item && typeof item === "object") {
          const rec = item as Record<string, unknown>;
          const raw = rec.date ?? rec.day ?? rec;
          return String(raw).slice(0, 10);
        }
        return "";
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Flutter `POST /payments/fund-wallet`. */
export async function fundWallet(amount: number): Promise<FundWalletResult> {
  const res = await getApiClient().post("/payments/fund-wallet", { amount });
  const envelope = parseServerResponse<unknown>(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
  const data =
    envelope.data && typeof envelope.data === "object"
      ? (envelope.data as Record<string, unknown>)
      : {};
  const authorizationUrl = String(
    data.authorization_url ?? data.authorizationUrl ?? "",
  );
  const reference = String(data.reference ?? "");
  if (!authorizationUrl || !reference) {
    throw new ApiError({
      message: "Please try payment again",
      code: "INVALID_FUND_PAYLOAD",
      status: envelope.statusCode,
    });
  }
  return {
    authorizationUrl,
    reference,
    accessCode:
      data.access_code != null || data.accessCode != null
        ? String(data.access_code ?? data.accessCode)
        : null,
  };
}

/** Confirms a Paystack charge, retrying while the charge is still settling. */
export async function verifyPaymentWithRetry(
  reference: string,
  attempts = 3,
): Promise<void> {
  let last: unknown;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await verifyPayment(reference);
      return;
    } catch (error) {
      last = error;
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }
  }
  throw last;
}

/** Flutter `POST /payments/verify/:reference`. */
export async function verifyPayment(reference: string): Promise<void> {
  const res = await getApiClient().post(`/payments/verify/${reference}`);
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

/** Flutter `POST /booking` — apartment. */
export async function submitApartmentBooking(
  input: CreateApartmentBookingInput,
): Promise<void> {
  const res = await getApiClient().post("/booking", {
    serviceType: "apartment",
    apartmentId: input.apartmentId,
    startDate: input.startDate,
    endDate: input.endDate,
    totalAmout: input.totalAmout,
  });
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

/** Flutter `POST /booking` — ride. */
export async function submitRideBooking(
  input: CreateRideBookingInput,
): Promise<void> {
  const res = await getApiClient().post("/booking", {
    serviceType: "ride",
    rideId: input.rideId,
    startDate: input.startDate,
    pickupPlaceId: input.pickupPlaceId,
    totalHours: input.totalHours,
    notes: input.notes,
    securityDetails: input.securityDetails,
  });
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}
export type CreateApartmentListingInput = {
  apartmentName: string;
  details: string;
  address: string;
  placeId?: string | null;
  apartmentType: string;
  numberOfBedrooms: number;
  amenities: string[];
  pricePerDay: number;
  cautionFee: number;
  houseRules?: string;
  maxGuests: number;
  checkIn?: string | null;
  checkOut?: string | null;
  images: Array<{ uri: string; mimeType?: string | null; fileName?: string | null }>;
};

export type CreateRideListingInput = {
  rideName: string;
  rideDescription: string;
  address: string;
  placeId?: string | null;
  rideType: string;
  features: string[];
  pricePerHour: number;
  cautionFee: number;
  rules?: string;
  maxPassengers: number;
  plateNumber?: string;
  color?: string;
  images: Array<{ uri: string; mimeType?: string | null; fileName?: string | null }>;
};

function appendListingImages(
  form: FormData,
  field: string,
  images: Array<{ uri: string; mimeType?: string | null; fileName?: string | null }>,
) {
  images.forEach((img, index) => {
    const name =
      img.fileName?.trim() ||
      `image_${index}.${(img.mimeType ?? "image/jpeg").split("/")[1] ?? "jpg"}`;
    form.append(field, {
      uri: img.uri,
      type: img.mimeType ?? "image/jpeg",
      name,
    } as unknown as Blob);
  });
}

/** Flutter agent `POST /apartment` multipart. */
export async function createApartmentListing(
  input: CreateApartmentListingInput,
): Promise<void> {
  const form = new FormData();
  form.append("apartmentName", input.apartmentName);
  form.append("details", input.details);
  form.append("address", input.address);
  if (input.placeId) form.append("placeId", input.placeId);
  form.append("apartmentType", input.apartmentType.toLowerCase());
  form.append("numberOfBedrooms", String(input.numberOfBedrooms));
  form.append("pricePerDay", String(input.pricePerDay));
  form.append("cautionFee", String(input.cautionFee));
  form.append("maxGuests", String(input.maxGuests));
  if (input.houseRules) form.append("houseRules", input.houseRules);
  if (input.checkIn) form.append("checkIn", input.checkIn);
  if (input.checkOut) form.append("checkOut", input.checkOut);
  input.amenities.forEach((name, i) => {
    form.append(`amenities[${i}]`, name);
  });
  appendListingImages(form, "apartmentImages", input.images);

  const res = await getApiClient().post("/apartment", form);
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

/** Flutter agent `POST /ride` multipart. */
export async function createRideListing(
  input: CreateRideListingInput,
): Promise<void> {
  const form = new FormData();
  form.append("rideName", input.rideName);
  form.append("rideDescription", input.rideDescription);
  form.append("address", input.address);
  if (input.placeId) form.append("placeId", input.placeId);
  form.append("rideType", input.rideType.toLowerCase());
  form.append("pricePerHour", String(input.pricePerHour));
  form.append("cautionFee", String(input.cautionFee));
  form.append("maxPassengers", String(input.maxPassengers));
  if (input.rules) form.append("rules", input.rules);
  if (input.plateNumber) form.append("plateNumber", input.plateNumber);
  if (input.color) form.append("color", input.color);
  input.features.forEach((name, i) => {
    form.append(`features[${i}]`, name);
  });
  appendListingImages(form, "rideImages", input.images);

  const res = await getApiClient().post("/ride", form);
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}

type UploadImage = {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
};

function appendSingleImage(form: FormData, field: string, image: UploadImage) {
  const name =
    image.fileName?.trim() ||
    `photo.${(image.mimeType ?? "image/jpeg").split("/")[1] ?? "jpg"}`;
  form.append(field, {
    uri: image.uri,
    type: image.mimeType ?? "image/jpeg",
    name,
  } as unknown as Blob);
}

/** Flutter `PATCH /users/profile-picture` (agent: `/agents/profile-picture`). */
export async function uploadProfilePicture(image: UploadImage): Promise<CurrentUser | null> {
  const prefix = getEnv().APP_TARGET === "agent" ? "agents" : "users";
  const form = new FormData();
  appendSingleImage(form, "profilePicture", image);
  const res = await getApiClient().patch(`/${prefix}/profile-picture`, form);
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
  return fetchProfile();
}

/** Flutter `POST /users/kyc` (agent: `/agents/kyc`) — NIN + selfie multipart. */
export async function verifyKyc(input: {
  nin: string;
  selfie: UploadImage;
}): Promise<CurrentUser | null> {
  const prefix = getEnv().APP_TARGET === "agent" ? "agents" : "users";
  const form = new FormData();
  form.append("nin", input.nin.trim());
  appendSingleImage(form, "selfie", input.selfie);
  const res = await getApiClient().post(`/${prefix}/kyc`, form);
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
  return fetchProfile();
}

/** Flutter user `DELETE /users/me` with `{ password }`. */
export async function deleteAccount(password: string): Promise<void> {
  const prefix = getEnv().APP_TARGET === "agent" ? "agents" : "users";
  const res = await getApiClient().delete(`/${prefix}/me`, {
    data: { password },
  });
  const envelope = parseServerResponse(res.data);
  if (!envelope.isSuccess) {
    throw new ApiError({
      message: envelope.errorMessage,
      code: "API_ERROR",
      status: envelope.statusCode,
    });
  }
}
