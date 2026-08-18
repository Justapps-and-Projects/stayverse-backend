import { useQuery } from "@tanstack/react-query";
import { fetchHealth } from "../api/endpoints/health";
import { queryKeys } from "../query/client";

export function useHealthQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: fetchHealth,
    enabled,
    staleTime: 60_000,
  });
}
