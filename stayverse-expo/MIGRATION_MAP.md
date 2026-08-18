# Riverpod → Zustand / React Query Migration Map

Source: inventory of all Riverpod providers in `stayverse-user-app-master` and `stayverse-agent-app-master` (Phase 5).  
**No FutureProvider / StreamProvider found.** Stream Chat realtime lives outside Riverpod. Socket.IO scaffolding → Phase 7 (done — see [MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-7--socketio)).

Legend: **Z** = Zustand · **RQ** = React Query · **H** = Hybrid (split) · **P7** = Phase 7 · **DI** = drop (use TS modules)

---

## Auth / Session

| Riverpod | App | Target | Expo |
|----------|-----|--------|------|
| `loginController` | both | H | `useLoginMutation` + auth form local state |
| `signUpController` | both | H | `useRegisterMutation` + signup screen state |
| `verifyCodeController` | both | H | `useVerifyTokenMutation` / `useSendTokenMutation` |
| `forgetPasswordController` | both | H | `useRequestForgotPasswordMutation` |
| `resetPasswordControllerProvider` | both | H | `useForgotPasswordMutation` |
| `logOutController` | both | Z | `useAuthStore.logout` |

---

## Dashboard / Shell

| Riverpod | App | Target | Expo |
|----------|-----|--------|------|
| `dashboadController` | both | H | `useDashboardStore` + `useProfileQuery` / auth user |

---

## Home / Discover / Search / Maps

| Riverpod | App | Target | Expo |
|----------|-----|--------|------|
| `homeController` | user | H | `useHomeStore` + `useHomeApartmentsQuery` / `useHomeRidesQuery` / `useHomeChefsQuery` |
| `searchController` | user | H | `useSearchStore` + `useSearchResultsQuery` |
| `mapController` | user | Z | `useMapStore` |
| `overviewController` | agent | RQ | `useAgentOverviewQuery` |
| `favouriteController` | user | H | `useFavouritesUiStore` + `useFavouritesQuery` |

---

## Apartments / Rides / Chef (user browse)

| Riverpod | App | Target | Expo |
|----------|-----|--------|------|
| `apartmentDetailsController` | user | H | `useApartmentDetailsQuery` + local UI |
| `apartmentBookingsController` | user | Z | `useBookingFormStore` (apartment) |
| `bookingPaymenrController` | user | H | RQ mutation (Phase 6+) + `useBookingFormStore` |
| `carDetailsController` | user | H | `useRideDetailsQuery` |
| `rideBookingsController` | user | Z | `useBookingFormStore` (ride) |
| `rideBookingPaymenrController` | user | H | RQ mutation (Phase 6+) |
| `chefDetailsController` | user | H | `useChefDetailsQuery` |

---

## Bookings / Reviews

| Riverpod | App | Target | Expo |
|----------|-----|--------|------|
| `bookingController` | both | H | `useBookingsUiStore` + `useBookingsQuery` |
| `reviewController` | both | H | `useReviewsQuery` + review mutation (Phase 6+) |

---

## Chat / Messaging

| Riverpod | App | Target | Expo |
|----------|-----|--------|------|
| `chatController` | both | Z | `useChatUiStore` |
| `chatMessagesProvider` | both | Z | `useChatUiStore` (local demo) |
| Stream Chat channels/messages | both | P7 | Phase 7 — not Riverpod |
| `proposalController` | both | H | RQ mutation (Phase 6+) + form local state |

---

## Profile / KYC / Selfie

| Riverpod | App | Target | Expo |
|----------|-----|--------|------|
| `profileController` | both | H | `useProfileUiStore` + `useProfileQuery` |
| `kycController` | both | H | RQ mutation (Phase 6+) + `useSelfieStore` |
| `deleteAccountController` | user | H | RQ mutation (Phase 6+) |
| `selfieController` | both | Z | `useSelfieStore` |
| `listedApartmentController` | agent | RQ | `useListedApartmentsQuery` |
| `listedRideController` | agent | RQ | `useListedRidesQuery` |

---

## Wallet

| Riverpod | App | Target | Expo |
|----------|-----|--------|------|
| `walletController` | both | H | `useWalletUiStore` + `useWalletQuery` |
| `bankController` | both | H | `useBanksQuery` + UI store |
| `withdrawalController` | both | H | `useWalletUiStore` + RQ mutation (Phase 6+) |

---

## Agent: Apartment Owner

| Riverpod | Target | Expo |
|----------|--------|------|
| `apartmentController` / `editApartmentController` | H | RQ mutation (Phase 6+) + `useApartmentAdvertStore` |
| `createApartmentAdvert` / `editApartmentAdvert` | Z | `useApartmentAdvertStore` |
| `createApartmentImagePicker` / `editApartmentImagePicker` | Z | `useApartmentAdvertStore.imageUris` |
| `createImageSelectionValid` / `editImageSelectionValid` | Z | derived selectors on store |
| `createPickImageProvider` / `editPickImageProvider` | Z | `useApartmentAdvertStore` |
| `amenitiesRepositoryProvider` | DI | TS module (Phase 6+) |
| `createApartmentAmenities` / `editApartmentAmenities` | Z | `useApartmentAdvertStore.amenityIds` |
| `createApartmentSelectionValid` / `editApartmentSelectionValid` | Z | derived |
| `createApartmentType` / `editApartmentType` | Z | `useApartmentAdvertStore.apartmentType` |
| `amenityProvider` | Z | `useApartmentAdvertStore` |
| `showAllAmenitiesProvider` (apartment) | Z | `useApartmentAdvertStore.showAllAmenities` |
| `textFieldProvider` | Z | screen-local / advert store fields |
| `createApartmentTimePicker` / `editApartmentTimePicker` | Z | `checkInTime` / `checkOutTime` on advert store |

---

## Agent: Ride Owner

| Riverpod | Target | Expo |
|----------|--------|------|
| `rideController` / `editRideController` | H | RQ mutation + `useRideAdvertStore` |
| `createRideAdvertProvider` / `editRideAdvertProvider` | Z | `useRideAdvertStore` |
| `createRideImagePickerProvider` / `editRideImagePickerProvider` | Z | `imageUris` |
| `createImageSelectionValidProvider` / `editImageSelectionValidProvider` | Z | derived |
| `rideAmenitiesRepositoryProvider` | DI | TS module |
| `createRideAmenitiesProvider` / `editRideAmenitiesProvider` | Z | `amenityIds` |
| `createAmenitySelectionValidProvider` / `editAmenitySelectionValidProvider` | Z | derived |
| `createVehicleType` / `editVehicleType` | Z | `vehicleType` |
| `rideAmenityProvider` | Z | `useRideAdvertStore` |
| `showAllAmenitiesProvider` (ride) | Z | `showAllAmenities` — **name collision resolved by store split** |

---

## Agent: Chef Owner

| Riverpod | Target | Expo |
|----------|--------|------|
| `chefController` | H | RQ mutation + `useChefFormStore` |
| `culinarySpecialtiesRepositoryProvider` | DI | TS module |
| `createCulinarySpecialtiesProvider` / `editCulinarySpecialtiesProvider` | Z | `specialtyIds` |
| `createCulinarySpecialtyValidProvider` / `editCulinarySpecialtyValidProvider` | Z | derived |
| `showAllCulinarySpecialtiesProvider` | Z | `showAllSpecialties` |

---

## Store / hook index (packages/core)

### Zustand (`src/stores/`)
`useAuthStore`, `useDashboardStore`, `useHomeStore`, `useSearchStore`, `useMapStore`, `useBookingFormStore`, `useBookingsUiStore`, `useChatUiStore`, `useProfileUiStore`, `useWalletUiStore`, `useApartmentAdvertStore`, `useRideAdvertStore`, `useChefFormStore`, `useSelfieStore`, `useFavouritesUiStore`

### React Query (`src/hooks/`)
`useHealthQuery`, `useLoginMutation`, `useRegisterMutation`, `useVerifyTokenMutation`, `useSendTokenMutation`, `useRequestForgotPasswordMutation`, `useForgotPasswordMutation`, `useHomeApartmentsQuery`, `useHomeRidesQuery`, `useHomeChefsQuery`, `useSearchResultsQuery`, `useApartmentDetailsQuery`, `useRideDetailsQuery`, `useChefDetailsQuery`, `useBookingsQuery`, `useFavouritesQuery`, `useProfileQuery`, `useWalletQuery`, `useBanksQuery`, `useAgentOverviewQuery`, `useListedApartmentsQuery`, `useListedRidesQuery`, `useReviewsQuery`

Catalog queryFns currently return empty placeholders until Dio services are ported (Phase 6+). Auth + health are live against the backend.
