import axios from "axios";
import { getEnv } from "../config/env";
import { LAGOS_BIAS_CENTER, type StayverseCoords } from "../location/location";

export type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText?: string;
  secondaryText?: string;
};

export type ReverseGeocodeResult = {
  formattedAddress: string | null;
  placeId: string | null;
};

function apiKey(): string {
  return getEnv().GOOGLE_API_KEY || "";
}

/**
 * Flutter `BrimPlace.getPlaces` — Places API (New) autocomplete.
 * Bias: Lagos circle 50km, `includedRegionCodes: ["ng"]`.
 */
export async function autocompletePlaces(
  query: string,
  options?: { center?: StayverseCoords; radiusMeters?: number },
): Promise<PlaceSuggestion[]> {
  const input = query.trim();
  if (!input || !apiKey()) return [];

  const center = options?.center ?? LAGOS_BIAS_CENTER;
  try {
    const { data } = await axios.post(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        input,
        locationBias: {
          circle: {
            center: {
              latitude: center.latitude,
              longitude: center.longitude,
            },
            radius: options?.radiusMeters ?? 50_000,
          },
        },
        includedRegionCodes: ["ng"],
      },
      {
        headers: {
          "X-Goog-Api-Key": apiKey(),
          "Content-Type": "application/json",
        },
        timeout: 12_000,
      },
    );

    const suggestions = (data?.suggestions ?? []) as Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }>;

    const mapped = suggestions
      .map((s): PlaceSuggestion | null => {
        const p = s.placePrediction;
        if (!p?.placeId) return null;
        return {
          placeId: p.placeId,
          description: p.text?.text ?? "",
          mainText: p.structuredFormat?.mainText?.text,
          secondaryText: p.structuredFormat?.secondaryText?.text,
        };
      })
      .filter((x): x is PlaceSuggestion => x != null);

    if (mapped.length > 0) return mapped;
    return legacyAutocomplete(input);
  } catch {
    return legacyAutocomplete(input);
  }
}

/** Places API (New) is often disabled on the same key the Geocoding API uses. */
async function legacyAutocomplete(input: string): Promise<PlaceSuggestion[]> {
  try {
    const { data } = await axios.get(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json",
      {
        params: {
          input,
          components: "country:ng",
          key: apiKey(),
        },
        timeout: 12_000,
      },
    );
    const predictions = (data?.predictions ?? []) as Array<{
      place_id?: string;
      description?: string;
      structured_formatting?: {
        main_text?: string;
        secondary_text?: string;
      };
    }>;
    return predictions
      .map((item): PlaceSuggestion | null => {
        if (!item.place_id) return null;
        return {
          placeId: item.place_id,
          description: item.description ?? "",
          mainText: item.structured_formatting?.main_text,
          secondaryText: item.structured_formatting?.secondary_text,
        };
      })
      .filter((item): item is PlaceSuggestion => item != null);
  } catch {
    return [];
  }
}

/** Flutter `BrimPlace.getAddress` — reverse geocode. */
export async function reverseGeocode(
  coords: StayverseCoords,
): Promise<ReverseGeocodeResult | null> {
  if (!apiKey()) return null;
  try {
    const { data } = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          latlng: `${coords.latitude},${coords.longitude}`,
          key: apiKey(),
        },
        timeout: 12_000,
      },
    );
    const first = data?.results?.[0];
    if (!first) return { formattedAddress: null, placeId: null };
    return {
      formattedAddress: first.formatted_address ?? null,
      placeId: first.place_id ?? null,
    };
  } catch {
    return null;
  }
}

/** Flutter agent-only `BrimPlace.geocodeAddress` (`region=ng`). */
export async function geocodeAddress(
  address: string,
): Promise<(StayverseCoords & { placeId?: string | null; formattedAddress?: string }) | null> {
  const q = address.trim();
  if (!q || !apiKey()) return null;
  try {
    const { data } = await axios.get(
      "https://maps.googleapis.com/maps/api/geocode/json",
      {
        params: {
          address: q,
          region: "ng",
          key: apiKey(),
        },
        timeout: 12_000,
      },
    );
    const first = data?.results?.[0];
    const loc = first?.geometry?.location;
    if (!loc) return null;
    return {
      latitude: Number(loc.lat),
      longitude: Number(loc.lng),
      placeId: first.place_id ?? null,
      formattedAddress: first.formatted_address ?? q,
    };
  } catch {
    return null;
  }
}
