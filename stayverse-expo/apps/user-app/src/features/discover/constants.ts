import type { HomeFeedTab } from "@stayverse/core";
import type { AppIconName } from "@stayverse/ui";

export const HOME_TABS: {
  key: HomeFeedTab;
  label: string;
  icon: AppIconName;
  hint: string;
}[] = [
  { key: "apartments", label: "Apartments", icon: "shortlet", hint: "Search Places" },
  { key: "rides", label: "Rides", icon: "car", hint: "Search Rides" },
  { key: "chefs", label: "Chefs", icon: "chef", hint: "Search Chefs" },
];
