import type {
  BookingSummary,
  BookingsPageResult,
  CatalogServiceType,
  ListingDetails,
  ListingHost,
  ListingSummary,
  TransactionStatus,
  TransactionSummary,
  TransactionType,
  TransactionsPageResult,
} from "./types";
import { extractArea } from "../../utils/locationPrivacy";
import {
  extractTypedList,
  readId,
  readListingImage,
  readString,
  readStringList,
} from "./listParsers";

/** Flutter `ServiceLocation` — GeoJSON `[lng, lat]`. */
function readGeoCoords(
  raw: Record<string, unknown>,
): { latitude: number; longitude: number } | null {
  const loc =
    raw.location && typeof raw.location === "object"
      ? (raw.location as Record<string, unknown>)
      : null;
  const coords = loc?.coordinates;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lng = Number(coords[0]);
  const lat = Number(coords[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { latitude: lat, longitude: lng };
}

export function mapApartment(raw: Record<string, unknown>): ListingSummary | null {
  const id = readId(raw);
  if (!id) return null;
  const geo = readGeoCoords(raw);

  return {
    id,
    kind: "apartment",
    title: readString(raw.apartmentName) ?? "Unnamed Apartment",
    subtitle: extractArea(readString(raw.address)),
    price: typeof raw.pricePerDay === "number" ? raw.pricePerDay : Number(raw.pricePerDay) || 0,
    priceSuffix: "/day",
    imageUrl: readListingImage(raw),
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
  };
}

export function mapRide(raw: Record<string, unknown>): ListingSummary | null {
  const id = readId(raw);
  if (!id) return null;
  const geo = readGeoCoords(raw);

  return {
    id,
    kind: "ride",
    title: readString(raw.rideName) ?? "Unnamed Ride",
    subtitle: readString(raw.address) ?? "Location not available",
    price: typeof raw.pricePerHour === "number" ? raw.pricePerHour : Number(raw.pricePerHour) || 0,
    priceSuffix: "/hr",
    imageUrl: readListingImage(raw),
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
  };
}

export function mapChef(raw: Record<string, unknown>): ListingSummary | null {
  const id = readId(raw);
  if (!id) return null;
  const geo = readGeoCoords(raw);

  return {
    id,
    kind: "chef",
    title: readString(raw.fullName) ?? "",
    subtitle: readString(raw.bio) ?? "No bio available",
    price: typeof raw.pricingPerHour === "number" ? raw.pricingPerHour : Number(raw.pricingPerHour) || 0,
    priceSuffix: "/hr",
    imageUrl: readString(raw.coverPhoto),
    profileImageUrl: readString(raw.profilePicture),
    latitude: geo?.latitude ?? null,
    longitude: geo?.longitude ?? null,
  };
}

/**
 * Flutter `FavouriteResponse.data.data` — each row nests `apartment` | `ride` | `chef`.
 */
export function mapFavouritesList(
  kind: CatalogServiceType,
  payload: unknown,
): ListingSummary[] {
  const root =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  const nested = root?.data;
  const rows = Array.isArray(nested)
    ? nested
    : Array.isArray(payload)
      ? payload
      : [];

  const nestKey =
    kind === "apartment" ? "apartment" : kind === "ride" ? "ride" : "chef";
  const mapper =
    kind === "apartment" ? mapApartment : kind === "ride" ? mapRide : mapChef;

  return rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      const nestedItem = (row as Record<string, unknown>)[nestKey];
      if (!nestedItem || typeof nestedItem !== "object") return null;
      return mapper(nestedItem as Record<string, unknown>);
    })
    .filter((item): item is ListingSummary => item != null);
}

export function mapCatalogList(
  kind: CatalogServiceType,
  payload: unknown,
): ListingSummary[] {
  const data = payload;
  const listKey =
    kind === "apartment" ? "apartments" : kind === "ride" ? "rides" : "chefs";
  const rawItems = extractTypedList<Record<string, unknown>>(
    data as never,
    listKey,
  );

  const mapper =
    kind === "apartment" ? mapApartment : kind === "ride" ? mapRide : mapChef;

  return rawItems
    .map((item) => mapper(item))
    .filter((item): item is ListingSummary => item != null);
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function mapHost(raw: Record<string, unknown> | null): ListingHost | null {
  if (!raw) return null;
  const user =
    raw.user && typeof raw.user === "object"
      ? (raw.user as Record<string, unknown>)
      : raw;
  const firstname = readString(user.firstname);
  const lastname = readString(user.lastname);
  const name =
    [firstname, lastname].filter(Boolean).join(" ") ||
    readString(user.fullName) ||
    "Host";
  return {
    name,
    id: readId(raw) || readId(user),
    avatarUrl: readString(user.profilePicture),
    phone: readString(user.phoneNumber),
  };
}

function asBool(value: unknown): boolean {
  return value === true || value === "true";
}

/** Detail mappers — Flutter apartment / ride / chef detail fields. */
export function mapApartmentDetails(
  raw: Record<string, unknown>,
): ListingDetails | null {
  const summary = mapApartment(raw);
  if (!summary) return null;
  const images = readStringList(raw.apartmentImages);
  return {
    ...summary,
    priceSuffix: "/night",
    description: readString(raw.details),
    address: readString(raw.address),
    images: images.length ? images : summary.imageUrl ? [summary.imageUrl] : [],
    amenities: readStringList(raw.amenities),
    rules: readString(raw.houseRules),
    averageRating: readNumber(raw.averageRating),
    isFavourite: asBool(raw.isFavourite ?? raw.isFavorite),
    cautionFee: readNumber(raw.cautionFee) ?? 0,
    bedrooms: readNumber(raw.numberOfBedrooms),
    maxGuests: readNumber(raw.maxGuests),
    checkIn: readString(raw.checkIn),
    checkOut: readString(raw.checkOut),
    host: mapHost(
      raw.agent && typeof raw.agent === "object"
        ? (raw.agent as Record<string, unknown>)
        : null,
    ),
  };
}

export function mapRideDetails(
  raw: Record<string, unknown>,
): ListingDetails | null {
  const summary = mapRide(raw);
  if (!summary) return null;
  const images = readStringList(raw.rideImages);
  return {
    ...summary,
    title: readString(raw.rideName) ?? "Unnamed Ride",
    priceSuffix: "/hr",
    description: readString(raw.rideDescription),
    address: readString(raw.address),
    images: images.length ? images : summary.imageUrl ? [summary.imageUrl] : [],
    amenities: readStringList(raw.features),
    rules: readString(raw.rules),
    averageRating: readNumber(raw.averageRating),
    isFavourite: asBool(raw.isFavourite ?? raw.isFavorite),
    cautionFee: readNumber(raw.cautionFee) ?? 0,
    maxPassengers: readNumber(raw.maxPassengers),
    color: readString(raw.color),
    plateNumber: readString(raw.plateNumber),
    host: mapHost(
      raw.agent && typeof raw.agent === "object"
        ? (raw.agent as Record<string, unknown>)
        : null,
    ),
  };
}

export function mapChefDetails(
  raw: Record<string, unknown>,
): ListingDetails | null {
  const summary = mapChef(raw);
  if (!summary) return null;

  const experiencesRaw = Array.isArray(raw.experiences) ? raw.experiences : [];
  const certsRaw = Array.isArray(raw.certifications) ? raw.certifications : [];
  const features = Array.isArray(raw.features) ? raw.features : [];
  const featuredImages = features.flatMap((f) => {
    if (!f || typeof f !== "object") return [];
    const rec = f as Record<string, unknown>;
    return readStringList(rec.featuredImages ?? rec.images);
  });

  return {
    ...summary,
    priceSuffix: "/hour",
    description: readString(raw.bio),
    address: readString(raw.address),
    images: summary.imageUrl ? [summary.imageUrl] : [],
    amenities: [],
    rules: null,
    averageRating: readNumber(raw.averageRating),
    isFavourite: asBool(raw.isFavourite ?? raw.isFavorite),
    about: readString(raw.about) ?? readString(raw.bio),
    experiences: experiencesRaw.map((item) => {
      const rec =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      return {
        title: readString(rec.title) ?? readString(rec.role),
        company: readString(rec.company) ?? readString(rec.organization),
        description: readString(rec.description),
      };
    }),
    featuredImages,
    certifications: certsRaw.map((item) => {
      const rec =
        item && typeof item === "object"
          ? (item as Record<string, unknown>)
          : {};
      return {
        name: readString(rec.name) ?? readString(rec.title),
        issuer: readString(rec.issuer) ?? readString(rec.organization),
      };
    }),
    host: mapHost(
      raw.agent && typeof raw.agent === "object"
        ? (raw.agent as Record<string, unknown>)
        : null,
    ),
  };
}

export function mapListingDetails(
  kind: CatalogServiceType,
  payload: unknown,
): ListingDetails | null {
  const root =
    payload && typeof payload === "object"
      ? (payload as Record<string, unknown>)
      : null;
  if (!root) return null;

  // Some endpoints nest under apartment/ride/chef key.
  const nested =
    (root[kind] && typeof root[kind] === "object"
      ? (root[kind] as Record<string, unknown>)
      : null) ?? root;

  if (kind === "apartment") return mapApartmentDetails(nested);
  if (kind === "ride") return mapRideDetails(nested);
  return mapChefDetails(nested);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function parseServiceType(value: unknown): CatalogServiceType | null {
  const raw = readString(value)?.toLowerCase();
  if (!raw) return null;
  if (raw === "apartment" || raw === "apartments") return "apartment";
  if (raw === "ride" || raw === "rides") return "ride";
  if (raw === "chef" || raw === "chefs") return "chef";
  return null;
}

function firstImage(value: unknown): string | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const first = value[0];
  return typeof first === "string" && first.trim() ? first : null;
}

/** Flutter `Booking` / `BookingBase` getters for list cards. */
export function mapBooking(raw: Record<string, unknown>): BookingSummary | null {
  const id = readId(raw);
  if (!id) return null;

  const serviceType =
    parseServiceType(raw.serviceType) ??
    (asRecord(raw.apartment)
      ? "apartment"
      : asRecord(raw.ride)
        ? "ride"
        : asRecord(raw.chef)
          ? "chef"
          : null);
  if (!serviceType) return null;

  const nested =
    serviceType === "apartment"
      ? asRecord(raw.apartment)
      : serviceType === "ride"
        ? asRecord(raw.ride)
        : asRecord(raw.chef);

  const listingId = nested ? readId(nested) : "";
  if (!listingId) return null;

  let title = "";
  let address = "";
  let description = "";
  let imageUrl: string | null = null;

  if (serviceType === "apartment" && nested) {
    title = readString(nested.apartmentName) ?? "";
    address = readString(nested.address) ?? "";
    description = readString(nested.details) ?? "";
    imageUrl = firstImage(nested.apartmentImages);
  } else if (serviceType === "ride" && nested) {
    title = readString(nested.rideName) ?? "";
    address = readString(nested.address) ?? "";
    description = readString(nested.rideDescription) ?? "";
    imageUrl = firstImage(nested.rideImages);
  } else if (serviceType === "chef" && nested) {
    title = readString(nested.fullName) ?? "";
    address = readString(nested.address) ?? "";
    description = readString(nested.bio) ?? "";
    imageUrl = readString(nested.profilePicture);
  }

  const agent = asRecord(raw.agent);
  const guest =
    asRecord(raw.user) ??
    asRecord(raw.guest) ??
    asRecord(raw.bookedBy);

  return {
    id,
    status: readString(raw.status) ?? "",
    serviceType,
    listingId,
    title,
    address,
    description,
    imageUrl,
    totalPrice:
      typeof raw.totalPrice === "number"
        ? raw.totalPrice
        : Number(raw.totalPrice) || null,
    startDate: readString(raw.startDate),
    endDate: readString(raw.endDate),
    agentId: agent ? readId(agent) : null,
    guestName: guest
      ? [readString(guest.firstname), readString(guest.lastname)]
          .filter(Boolean)
          .join(" ") ||
        readString(guest.fullName) ||
        readString(guest.name)
      : null,
    guestPhone: guest
      ? readString(guest.phoneNumber) ?? readString(guest.phone)
      : null,
  };
}

/**
 * Flutter bookings list: `data.data` rows (or bare array).
 * Also returns pagination for infinite scroll.
 */
export function mapBookingsPage(
  payload: unknown,
  page: number,
): BookingsPageResult {
  const root = asRecord(payload);
  const nested = root?.data;
  const rows = Array.isArray(nested)
    ? nested
    : Array.isArray(payload)
      ? payload
      : [];

  const items = rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      return mapBooking(row as Record<string, unknown>);
    })
    .filter((item): item is BookingSummary => item != null);

  const pagination = asRecord(root?.pagination);
  const currentPage =
    typeof pagination?.currentPage === "number" ? pagination.currentPage : page;
  const totalPages =
    typeof pagination?.totalPages === "number" ? pagination.totalPages : null;
  const hasNextPage =
    typeof pagination?.hasNextPage === "boolean"
      ? pagination.hasNextPage
      : totalPages != null
        ? currentPage < totalPages
        : items.length >= 10;

  return { items, page: currentPage, hasNextPage };
}

function parseTransactionType(value: unknown): TransactionType {
  const raw = readString(value)?.toLowerCase();
  return raw === "debit" ? "debit" : "credit";
}

function parseTransactionStatus(value: unknown): TransactionStatus {
  const raw = readString(value)?.toLowerCase();
  if (raw === "successful" || raw === "success") return "successful";
  if (raw === "failed") return "failed";
  if (raw === "refunded") return "refunded";
  if (raw === "reversed") return "reversed";
  return "pending";
}

export function mapTransaction(
  raw: Record<string, unknown>,
): TransactionSummary | null {
  const id = readId(raw);
  if (!id) return null;

  const amount =
    typeof raw.amount === "number" ? raw.amount : Number(raw.amount) || 0;

  return {
    id,
    reference: readString(raw.reference),
    amount,
    type: parseTransactionType(raw.type),
    status: parseTransactionStatus(raw.status),
    description: readString(raw.description),
    createdAt: readString(raw.createdAt),
  };
}

/** Flutter `TransactionHistoryResponse` — `GET /payments`. */
export function mapTransactionsPage(
  payload: unknown,
  page: number,
): TransactionsPageResult {
  const root = asRecord(payload);
  const nested = root?.data;
  const rows = Array.isArray(nested)
    ? nested
    : Array.isArray(payload)
      ? payload
      : [];

  const items = rows
    .map((row) => {
      if (!row || typeof row !== "object") return null;
      return mapTransaction(row as Record<string, unknown>);
    })
    .filter((item): item is TransactionSummary => item != null);

  const pagination = asRecord(root?.pagination);
  const currentPage =
    typeof pagination?.currentPage === "number" ? pagination.currentPage : page;
  const totalPages =
    typeof pagination?.totalPages === "number" ? pagination.totalPages : null;
  const hasNextPage =
    typeof pagination?.hasNextPage === "boolean"
      ? pagination.hasNextPage
      : totalPages != null
        ? currentPage < totalPages
        : items.length >= 10;

  return { items, page: currentPage, hasNextPage };
}
