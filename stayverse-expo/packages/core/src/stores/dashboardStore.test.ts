import { beforeEach, describe, expect, it } from "vitest";
import { useDashboardStore } from "./dashboardStore";

describe("useDashboardStore", () => {
  beforeEach(() => {
    useDashboardStore.getState().reset();
  });

  it("tracks tab index", () => {
    useDashboardStore.getState().setTabIndex(2);
    expect(useDashboardStore.getState().tabIndex).toBe(2);
    useDashboardStore.getState().reset();
    expect(useDashboardStore.getState().tabIndex).toBe(0);
  });
});
