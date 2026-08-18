import { beforeEach, describe, expect, it } from "vitest";
import { useSearchStore } from "./searchStore";

describe("useSearchStore", () => {
  beforeEach(() => {
    useSearchStore.getState().resetFilters();
    useSearchStore.setState({ serviceType: "apartment" });
  });

  it("starts with default filters", () => {
    const s = useSearchStore.getState();
    expect(s.filters.query).toBe("");
    expect(s.filters.guests).toBe(1);
    expect(s.serviceType).toBe("apartment");
  });

  it("updates filter fields and resets", () => {
    const store = useSearchStore.getState();
    store.setQuery("lagos");
    store.setCity("Abuja");
    store.setPriceRange(1000, 5000);
    store.setGuests(3);
    store.setBedrooms(2);
    store.setListingType("duplex");
    store.setServiceType("ride");

    let s = useSearchStore.getState();
    expect(s.filters).toMatchObject({
      query: "lagos",
      city: "Abuja",
      minPrice: 1000,
      maxPrice: 5000,
      guests: 3,
      bedrooms: 2,
      listingType: "duplex",
    });
    expect(s.serviceType).toBe("ride");

    useSearchStore.getState().resetFilters();
    s = useSearchStore.getState();
    expect(s.filters.query).toBe("");
    expect(s.filters.guests).toBe(1);
    expect(s.serviceType).toBe("ride");
  });
});
