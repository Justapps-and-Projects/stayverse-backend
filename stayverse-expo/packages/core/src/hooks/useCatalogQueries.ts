import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createApartmentListing,
  createRideListing,
  createChefProfile,
  cancelBooking,
  deleteAccount,
  fetchAgentOverview,
  fetchApartmentDetails,
  fetchBanks,
  fetchBookings,
  fetchAgentBookings,
  fetchCatalogNewest,
  fetchCatalogRecommendations,
  fetchChefDetails,
  fetchFavourites,
  fetchHomeApartments,
  fetchHomeChefs,
  fetchHomeRides,
  fetchListedApartments,
  fetchListedRides,
  fetchProfile,
  fetchReviews,
  fetchRideDetails,
  fetchSearchResults,
  fetchTransactions,
  fetchUnavailableDates,
  fundWallet,
  resolveBankAccount,
  submitApartmentBooking,
  submitRideBooking,
  submitReview,
  toggleFavourite,
  updateBookingStatus,
  updatePassword,
  updateProfile,
  uploadProfilePicture,
  verifyKyc,
  verifyPayment,
  withdrawFunds,
  type CatalogServiceType,
  type ListingDetails,
  type ListingOwnerStatus,
} from "../api/endpoints/catalog";
import { queryKeys } from "../query/keys";
import { useSearchStore } from "../stores/searchStore";
import {
  useBookingsUiStore,
  type BookingsFilter,
} from "../stores/bookingsUiStore";
import { useAuthStore } from "../stores/authStore";

export function useCatalogRecommendationsQuery(kind: CatalogServiceType, enabled = true) {
  return useQuery({
    queryKey: queryKeys.home.recommendations(kind),
    queryFn: () => fetchCatalogRecommendations(kind),
    enabled,
  });
}

export function useCatalogNewestQuery(kind: CatalogServiceType, enabled = true) {
  return useQuery({
    queryKey: queryKeys.home.newest(kind),
    queryFn: () => fetchCatalogNewest(kind),
    enabled,
  });
}

export function useHomeApartmentsQuery() {
  return useQuery({
    queryKey: queryKeys.home.apartments(),
    queryFn: fetchHomeApartments,
  });
}

export function useHomeRidesQuery() {
  return useQuery({
    queryKey: queryKeys.home.rides(),
    queryFn: fetchHomeRides,
  });
}

export function useHomeChefsQuery() {
  return useQuery({
    queryKey: queryKeys.home.chefs(),
    queryFn: fetchHomeChefs,
  });
}

export function useSearchResultsQuery(enabled = true) {
  const filters = useSearchStore((s) => s.filters);
  const serviceType = useSearchStore((s) => s.serviceType);
  return useQuery({
    queryKey: queryKeys.search({ ...filters, serviceType }),
    queryFn: () =>
      fetchSearchResults({
        serviceType,
        query: filters.query,
        city: filters.city,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        guests: filters.guests,
        bedrooms: filters.bedrooms,
        listingType: filters.listingType,
      }),
    enabled,
  });
}

export function useApartmentDetailsQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.apartment(id ?? ""),
    queryFn: () => fetchApartmentDetails(id!),
    enabled: !!id,
  });
}

export function useRideDetailsQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ride(id ?? ""),
    queryFn: () => fetchRideDetails(id!),
    enabled: !!id,
  });
}

export function useChefDetailsQuery(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.chef(id ?? ""),
    queryFn: () => fetchChefDetails(id!),
    enabled: !!id,
  });
}

export function useListingDetailsQuery(
  kind: CatalogServiceType | undefined,
  id: string | undefined,
) {
  return useQuery({
    queryKey:
      kind === "ride"
        ? queryKeys.ride(id ?? "")
        : kind === "chef"
          ? queryKeys.chef(id ?? "")
          : queryKeys.apartment(id ?? ""),
    queryFn: () => {
      if (kind === "ride") return fetchRideDetails(id!);
      if (kind === "chef") return fetchChefDetails(id!);
      return fetchApartmentDetails(id!);
    },
    enabled: !!kind && !!id,
  });
}

export function useToggleFavouriteMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toggleFavourite,
    onMutate: async (vars) => {
      const key =
        vars.kind === "ride"
          ? queryKeys.ride(vars.id)
          : vars.kind === "chef"
            ? queryKeys.chef(vars.id)
            : queryKeys.apartment(vars.id);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ListingDetails | null>(key);
      if (previous) {
        queryClient.setQueryData<ListingDetails>(key, {
          ...previous,
          isFavourite: !previous.isFavourite,
        });
      }
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(ctx.key, ctx.previous);
      }
    },
    onSettled: (_data, _err, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.favourites(vars.kind),
      });
      void queryClient.invalidateQueries({
        queryKey:
          vars.kind === "ride"
            ? queryKeys.ride(vars.id)
            : vars.kind === "chef"
              ? queryKeys.chef(vars.id)
              : queryKeys.apartment(vars.id),
      });
    },
  });
}

export function useBookingsQuery(status?: BookingsFilter) {
  const storeFilter = useBookingsUiStore((s) => s.filter);
  const filter = status ?? storeFilter;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useInfiniteQuery({
    queryKey: queryKeys.bookings(filter),
    queryFn: ({ pageParam }) => fetchBookings(filter, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.hasNextPage ? last.page + 1 : undefined,
    enabled: isAuthenticated,
  });
}

/** Flutter agent Discover booking tabs — `GET /booking/agent`. */
export function useAgentBookingsQuery(status: BookingsFilter) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useInfiniteQuery({
    queryKey: queryKeys.agentBookings(status),
    queryFn: ({ pageParam }) => fetchAgentBookings(status, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.hasNextPage ? last.page + 1 : undefined,
    enabled: isAuthenticated,
  });
}

export function useFavouritesQuery(kind: CatalogServiceType, enabled = true) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.favourites(kind),
    queryFn: () => fetchFavourites(kind),
    enabled: isAuthenticated && enabled,
  });
}

export function useProfileQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const user = await fetchProfile();
      if (user) setUser(user);
      return user;
    },
    enabled: isAuthenticated,
  });
}

export function useWalletQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  return useQuery({
    queryKey: queryKeys.wallet,
    queryFn: async () => {
      const user = await fetchProfile();
      if (user) setUser(user);
      return {
        balance: user?.balance ?? 0,
        currency: "NGN" as const,
      };
    },
    enabled: isAuthenticated,
  });
}

export function useTransactionsQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useInfiniteQuery({
    queryKey: queryKeys.transactions,
    queryFn: ({ pageParam }) => fetchTransactions(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.hasNextPage ? last.page + 1 : undefined,
    enabled: isAuthenticated,
  });
}

export function useBanksQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.banks,
    queryFn: fetchBanks,
    enabled: isAuthenticated,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: (user) => {
      if (user) setUser(user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
    },
  });
}

export function useUpdatePasswordMutation() {
  return useMutation({ mutationFn: updatePassword });
}

export function useResolveBankAccountMutation() {
  return useMutation({ mutationFn: resolveBankAccount });
}

export function useWithdrawFundsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: withdrawFunds,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.wallet });
      void queryClient.invalidateQueries({ queryKey: queryKeys.transactions });
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useAgentOverviewQuery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.overview,
    queryFn: fetchAgentOverview,
    enabled: isAuthenticated,
  });
}

export function useListedApartmentsQuery(
  status: ListingOwnerStatus = "approved",
) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.listedApartments(status),
    queryFn: () => fetchListedApartments(status),
    enabled: isAuthenticated,
  });
}

export function useListedRidesQuery(status: ListingOwnerStatus = "approved") {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: queryKeys.listedRides(status),
    queryFn: () => fetchListedRides(status),
    enabled: isAuthenticated,
  });
}

export function useUnavailableDatesQuery(
  kind: CatalogServiceType | undefined,
  id: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.unavailableDates(kind ?? "", id ?? ""),
    queryFn: () => fetchUnavailableDates(kind!, id!),
    enabled: !!kind && !!id && kind !== "chef",
  });
}

export function useFundWalletMutation() {
  return useMutation({ mutationFn: fundWallet });
}

export function useVerifyPaymentMutation() {
  return useMutation({ mutationFn: verifyPayment });
}

export function useSubmitApartmentBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitApartmentBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useSubmitRideBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitRideBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCreateApartmentListingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createApartmentListing,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listed"] });
    },
  });
}

export function useCreateRideListingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createRideListing,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["listed"] });
    },
  });
}

export function useUploadProfilePictureMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: (user) => {
      if (user) setUser(user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useVerifyKycMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: verifyKyc,
    onSuccess: (user) => {
      if (user) setUser(user);
      void queryClient.invalidateQueries({ queryKey: queryKeys.profile });
    },
  });
}

export function useDeleteAccountMutation() {
  return useMutation({ mutationFn: deleteAccount });
}

export function useReviewsQuery(
  serviceType: CatalogServiceType | undefined,
  serviceId: string | undefined,
) {
  return useQuery({
    queryKey: queryKeys.reviews(`${serviceType ?? ""}:${serviceId ?? ""}`),
    queryFn: () => fetchReviews(serviceType!, serviceId!),
    enabled: !!serviceType && !!serviceId,
  });
}

export function useSubmitReviewMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitReview,
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.reviews(`${vars.serviceType}:${vars.serviceId}`),
      });
    },
  });
}

export function useCancelBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
      void queryClient.invalidateQueries({ queryKey: ["agentBookings"] });
    },
  });
}

export function useUpdateBookingStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBookingStatus,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["agentBookings"] });
      void queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useCreateChefProfileMutation() {
  return useMutation({ mutationFn: createChefProfile });
}
