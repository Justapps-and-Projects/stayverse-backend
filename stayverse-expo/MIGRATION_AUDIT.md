# Migration Audit — Local Storage

Phase 6: Flutter `SharedPreferences` (via `BrimStorage`) → Expo **MMKV** (non-sensitive) + **SecureStore** (secrets).

## Key map

| Flutter key (Env / Constant) | Example value | New storage | Expo location |
|------------------------------|---------------|-------------|---------------|
| `AUTH_USER_KEY` → `auth.user.key` | Current user JSON | **SecureStore** | `useAuthStore` persist (`stayverse-auth`) |
| `TOKEN_KEY` → `token.key` | Access JWT | **SecureStore** | `useAuthStore.accessToken` |
| `CHAT_TOKEN_KEY` → `chat.token.key` | Stream chat token | **SecureStore** | `useAuthStore.chatToken` |
| `SCREEN_STORAGE_KEY` → `screenStorageScreen.key` | Last route | **MMKV** | `StorageKeys.lastScreen` |
| `SESSION_STORAGE_KEY` → `session.user.key` | Session meta | **MMKV** | `StorageKeys.sessionMeta` |
| `RECENT_SEARCH_STORAGE_KEY` → `recent.search.storage.key` | Recent searches | **MMKV** | `StorageKeys.recentSearch` + `useSearchStore` |
| `RIDE_ID_KEY` → `ride.Id.Key` (user) | Last ride id | **MMKV** | `StorageKeys.rideId` |
| `Constant.deviceToken` → `deviceToken` | Push device token | **MMKV** | `StorageKeys.deviceToken` |
| *(new)* theme preference | light/dark/system | **MMKV** | `StorageKeys.theme` → `useThemeStore` |
| *(new)* onboarding flags | seen / experience picked | **MMKV** | `StorageKeys.onboarding` → `useOnboardingStore` |
| *(new)* search filters cache | filters object | **MMKV** | `StorageKeys.searchFilters` → `useSearchStore` |

## Rules

1. **Never** put `accessToken`, `chatToken`, or full auth user JSON in MMKV.
2. Auth persist adapter is `secureStorage` only (`packages/core/src/storage/secureStorage.ts`).
3. MMKV wrapper: `packages/core/src/storage/mmkv.ts` — falls back to in-memory if native module unavailable (Expo Go / tests). Use a **dev client / EAS build** for on-device persistence.

## Code pointers

- MMKV API: `mmkv`, `mmkvStorage`, `StorageKeys`, `isMmkvNative()`
- SecureStore API: `secureStorage`
- Riverpod/controller map: see [MIGRATION_MAP.md](./MIGRATION_MAP.md)

---

# Phase 7 — Socket.IO

Flutter Socket.IO was mostly scaffolding (production chat uses Stream Chat). Expo ports the same handshake and event names only — no invented events.

## Auth handshake (from Flutter `BaseSocketIO.connect`)

| Piece | Value |
|-------|--------|
| URL | `SOCKET_URL` or `API_BASE_URL` |
| Query | `role=user` \| `role=agent` (`APP_TARGET`) |
| Header | `Authorization: Bearer <accessToken>` |
| Extra | `auth: { token }` for RN engines that drop headers |

## Namespaces

| App | Key | Path |
|-----|-----|------|
| User | `main` | `/ws` |
| User | `chat` | `/ws/chat` |
| Agent | `main` | `/` |
| Agent | `background` | `/background` |

## Events (exact Flutter strings)

| Source | Name | Direction |
|--------|------|-----------|
| `MainSocketEvent.driverLocation` | `rider.example.location` | emit (unused in Flutter) |
| `BackgroundSocketEvent.driverLocation` | `driver.updateLocation` | emit (unused) |
| `listenForLocationUpdates` | `updated` | listen → RQ `liveLocation` |
| BrimChat `EventType` | `message.new` / `deleted` / `read`, `typing.start` / `stop` | listen → invalidate `chatPing` |

There is **no** Flutter `booking:updated` (or similar) — do not invent one.

## Lifecycle

- `SocketLifecycle` in both app root layouts → `useSocketConnection()`
- Connect when auth hydrated + authenticated; disconnect on logout
- Status: `useSocketStore` (shown on Me tab)

## Code

- `packages/core/src/realtime/socket.ts`, `events.ts`, `bridge.ts`, `types.ts`
- Hook: `useSocketConnection`

---

# Phase 8 — Firebase (Core, Messaging, Analytics)

Project: **`stayverse-82fdd`** (copied from Flutter apps — not fabricated).

## Config files (committed)

| App | Android | iOS |
|-----|---------|-----|
| User | `apps/user-app/google-services.json` (`com.stayversepro.app`) | `GoogleService-Info.plist` (`com.stayverse.app`) |
| Agent | `apps/agent-app/google-services.json` | `GoogleService-Info.plist` (`com.stayverse.agent.app`) |

## Push (FCM)

| Item | Behavior |
|------|----------|
| Permissions | Same flags as Flutter `askForPermission` |
| Token | iOS waits for APNs then FCM; Android `getToken()` |
| Backend | `PATCH /users\|agents/notifications/device-token` body `{ deviceToken, enable }` |
| Local | MMKV `deviceToken` |
| Foreground | Toast (curated_message special copy) |
| Tap | Greenfield deep links (Flutter never wired taps) → see `resolveNotificationHref` |
| Runtime | Requires **dev client / EAS build** — no-ops in Expo Go |

## Analytics

Flutter declared `firebase_analytics` but **logged zero custom events**.  
`packages/core/src/analytics/analytics.ts` wraps the SDK; `AnalyticsEvents` is empty on purpose so dashboards stay consistent.

## Code

- `packages/core/src/notifications/push.ts`, `routes.ts`, `NotificationLifecycle.tsx`
- `packages/core/src/analytics/analytics.ts`
- App wiring: `apps/*/src/FirebaseBootstrap.tsx`

## Native build

```bash
cd apps/user-app && npx expo prebuild
cd apps/agent-app && npx expo prebuild
# then: eas build / npx expo run:ios|android
```

---

# Phase 9 — Stream Chat

## Identity

| App | Stream user id | Token |
|-----|----------------|-------|
| User | `User._id` | login `chatToken` (`createToken(user._id)`) |
| Agent | `Agent._id` (`agentId`) | login `chatToken` (`createToken(agent._id)`) |

API key: `EXPO_PUBLIC_GET_STREAM_KEY` / `GET_STREAM_KEY` (same as Flutter `b8dpqx27vz3r`).

## Channels

- Type: `messaging`
- Id: omitted (distinct / `!members-*`)
- `extraData.members`: `[userId, agentId]`, `agent: { title }`
- List filter: `type=messaging` + `members $in [me]`, sort `last_message_at`, limit 20

## UI

- Inbox tab → `ChannelList`
- `/chat/[cid]` → `Channel` + `MessageList` + `MessageInput`
- Theme: `stayverseStreamTheme` (#FBC036)
- Custom: read-only `ProposalMessageCard` when `extraDataType === 'proposal'`

## Push

- `addDevice(token, 'firebase', undefined, 'Stayverse')` after FCM register
- Tap deep-link: `cid` / `channel_type`+`channel_id` → `/chat/...`

## Code

- `packages/core/src/chat/streamClient.ts`, `theme.ts`, `ProposalMessageCard.tsx`
- Apps: `StreamChatProvider`, `InboxChannelList`, `app/chat/[cid].tsx`

---

# Phase 10 — Maps & geolocation

## Packages

- `react-native-maps` (Google provider)
- `expo-location` (Geolocator replacement)

## Keys

| Use | Env |
|-----|-----|
| Places / Geocode REST | `EXPO_PUBLIC_GOOGLE_API_KEY` → `GOOGLE_API_KEY` |
| Native Map SDK (optional override) | `EXPO_PUBLIC_GOOGLE_MAPS_SDK_KEY` (agent Flutter used a separate native key) |

Copy `GOOGLE_API_KEY` from Flutter `.env` into monorepo `.env.development` as `EXPO_PUBLIC_GOOGLE_API_KEY`.

## Location

- Foreground permission on user dashboard enter (Flutter parity)
- `getCurrentPosition` — best accuracy + last-known fallback
- `watchPosition` — distance filter 5m
- Live: agent can `startLiveLocationBroadcast` → socket `driver.updateLocation`; listen `updated` → `mapStore.liveLocation`

## Map UI

| Component | Flutter parity |
|-----------|----------------|
| `SearchMapView` | Search map tab — markers, fit bounds, result card |
| `DetailMapEmbed` | Apartment/Car map — marker, zoom 18, tilt 60 |
| `LocationMapPicker` | Chef picker — center pin + reverse geocode |
| `PlacesAutocompleteField` | NG-biased Places Autocomplete (New) |

Custom style: `packages/assets/maps/map_style.json`  
Marker: `packages/assets/images/apartment-marker.png`  
Default center: `6.6018, 3.3515`

## Dev entry

- User: Me → Maps (`/dev/map`)
- Agent: Me → Location tools (`/map`)

## Not required for parity (unused in Flutter UI)

Clustering, route polylines, `getLatLngFromPlaceId` call sites, `sendMyCurrentLocation`.

---

# Phase 11 — Media & misc UI

## Packages

| Package | Role |
|---------|------|
| `expo-camera` | KYC selfie (`SelfieCamera`) |
| `expo-image-picker` | Profile camera/gallery + listing multi-pick |
| `expo-image-manipulator` | User upload JPEG 80 / min 1440 |
| `lottie-react-native` | Empty-state Lotties |
| `react-native-svg` | `AppIcon` + `svgRegistry` |
| `react-native-webview` | Tawk support + Paystack |

## Flutter parity

| Flow | Expo |
|------|------|
| Profile pick | quality **85**, front camera |
| User upload prep | JPEG **80**, min edge **1440** |
| Agent listing images | multi 2–12, ≤5MB, jpg/png/jpeg/gif, **no compress** |
| KYC selfie | front, ellipse overlay, ~2s delay, zoom ≈ Flutter level 2 |
| Lottie | `empty`, `apartment-empty`, `chefs-empty`, `rides-empty` |
| SVG | `AppIcons.<name>` → `icon-<kebab>.svg` |
| WebView | close on `https://stayverse.com*`; Paystack success unless `/cancel` |
| Tawk | `TAWK_SUPPORT_URL` (Flutter ChatSupportPage) |

Permission strings copied from Flutter `Info.plist` into both app configs + plugins.

## Dev entry

- User: Me → Media (`/dev/media`)
- Agent: Me → Media tools (`/media`)

## Assets

- `packages/assets/lottie/*`
- `packages/assets/icons/svgs/*` (+ brand)
- Registry: `packages/ui/src/icons/svgRegistry.ts`

---

# Phase 12 — Error monitoring (Sentry)

## Package

`@sentry/react-native` ~7.11 — Expo config plugin + Metro `getSentryExpoConfig`.

## Flutter parity

| Flutter | Expo |
|---------|------|
| `SENTRY_DNS` (typo in `.env`) | `EXPO_PUBLIC_SENTRY_DSN` |
| `environment.name.toUpperCase()` → `DEV` / `PROD` | `DEV` / `STAGING` / `PROD` from `APP_ENV` |
| `release: deviceInformation.appVersion` | `stayverse-{user\|agent}@{version}+{build}` (`dist` = build) |
| `SentryUser(id: deviceId)` | Auth user id when logged in (`SentryUserBridge`) |
| Manual `SenrtyClientReporter` | SDK auto unhandled + `captureStayverseException` |

Flutter had **no** breadcrumb helpers — Phase 12 adds:

- Navigation (`SentryNavigationBridge` + `reactNavigationIntegration`)
- API 4xx/network errors (Axios interceptor)
- Socket disconnect / connect_error

## Setup

1. Copy Flutter `SENTRY_DNS` → monorepo `.env.*` as `EXPO_PUBLIC_SENTRY_DSN`
2. Rebuild **dev client** (native Sentry + plugin)
3. Optional EAS: `SENTRY_AUTH_TOKEN` (+ org/project) for source maps

## Dev entry

- User: Me → Sentry (`/dev/sentry`) — throw / capture test error
- Agent: Me → Sentry (`/sentry`)

---

# Phase 13 — Feature screen port

Template phase: port one Flutter screen at a time (increasing complexity).  
Reference [MIGRATION_MAP.md](./MIGRATION_MAP.md) for stores/hooks; use `@stayverse/ui` tokens/components.

## Checklist (user unless noted)

| Screen | Status | Route |
|--------|--------|-------|
| **Login** | ✅ | `/(auth)/login` (user + agent) |
| **Signup / SignupAs** | ✅ | `/(auth)/signup`, `signup-as` |
| **Verify OTP** | ✅ | `/(auth)/verify-otp` |
| **Forgot / Reset password** | ✅ | forgot / reset |
| **Onboarding / pick experience** | ✅ | `/onboarding`, `pick-experience` (user) |
| **Discover (Home)** | ✅ | `/(tabs)/` — greeting, search bar, category tabs, recommendations + newly listed |
| Search | ✅ | `/search` |
| Favourites | ✅ | `/(tabs)/favourite` — Apartments / Rides / Chefs, `GET /favorites/user` |
| Bookings list | ✅ | `/(tabs)/bookings` — Accepted / Completed / Pending / Rejected, `GET /booking/user` |
| Profile | ✅ | Me tab — `GET /users/me`, menu rows, logout confirm; child screens stubbed |
| Wallet | ✅ | `/wallet` — balance + Activities (`GET /payments`); Add Funds/Withdraw deferred |
| Apartment / Ride / Chef detail | ✅ | `/listing/[type]/[id]` — `GET /{type}/:id`, favourite toggle; Rent now → book stub |
| Booking flow + Paystack | ✅ | `/book/[type]/[id]` → payment → Paystack WebView → confirmed |
| Agent overview / add listing | ✅ | Discover metrics + Me listed apartments/cars; Add tab stubbed |

## Login (this iteration)

Flutter sources: `lib/auth/view/page/login_page.dart` (both apps).

| Parity | Notes |
|--------|-------|
| Copy | Login / Sign In, subtitle, Forgot Password, Or, Don’t  have an account? Signup |
| Validation | `validateEmail` / `validatePassword` — Flutter messages |
| CTA | User primary yellow **Login**; agent **dark** **Sign In** |
| Nav | success → tabs; email unverified → verify-otp + success toast |
| Social | Not ported (commented out in Flutter) |
| Dev | User prefill `user.demo@stayverse.local` / `Pass1234!` in `__DEV__` |

## Signup / SignupAs (this iteration)

Flutter sources: `sign_up_page.dart` (both), agent `signup_as_page.dart`.

| Parity | Notes |
|--------|-------|
| Fields | First/Last name, email, phone, create/confirm password |
| Validation | `validateName` / email / phone / password / confirm — Flutter messages |
| Phone | `normalizeNigerianPhone` before POST |
| API | User `POST /users/register`; agent `POST /agents/register` + `serviceType` |
| Success | Toast (emailDelivered vs manual); 6-digit otp → verify + login → tabs; else verify-otp |
| Legal | Terms & Conditions / Privacy Policy sheets (Flutter copy) |
| SignupAs | Dark `#2C2C2C`, bubble collage, Chef / Apartment Owner / Car Owner CTAs |

## Verify OTP (this iteration)

Flutter sources: `verify_otp_page.dart` + `verify_code_controller.dart` (both apps).

| Parity | Notes |
|--------|-------|
| Copy | Title `6-Digit Code`; subtitle `Please enter the code sent to {email}`; `Resend email` |
| PIN | 6 underline cells, obscured `*`; `validatePin` messages |
| Cooldown | 60s from mount; restart only after successful resend; `MM:SS` |
| Success | verify-token → login(email, password) → `/(tabs)` |
| Auto | `initialOtp` length 6 → prefill + auto-submit |
| Resend | User: OTP-in-body → “code ready…”; else / agent → “sent to your email.” |
| Login handoff | Unverified login passes `email` + `password` query params |

## Forgot / Reset password (this iteration)

Flutter sources: `forgot_password.dart` / `reset_password.dart` (both apps).

| Parity | Notes |
|--------|-------|
| Forgot copy | `Forgot Password`, `Input your registered Email address`, `Send Code` |
| Reset copy | `Reset Password`, `Enter Your New Password`, OTP hint with email |
| Validation | email / pin / password; user confirm match; agent confirm = password-only |
| Nav | forgot success toast + **replace** → reset; reset success → login |
| Toasts | `Email sent successfully` / `Password reset successfully` |

## Onboarding / pick experience (this iteration)

Flutter sources: `onboarding.dart`, `pick_an_experience.dart` (user); agent `onboarding.dart` only.

| Parity | Notes |
|--------|-------|
| User carousel | 3 slides (shortlet / chef / cab), Next → Get Started → pick experience |
| Agent carousel | 2 host slides, dark CTA, Get Started → login + persist skip |
| Pick experience | User vs Host cards; User → login; Host → agent store |
| Legal | Terms & Conditions / Privacy Policy on carousel |
| Gate | `useOnboardingStore.hasSeenOnboarding` — first launch → `/onboarding` |
| Assets | `shortlet.png`, `chef.png`, `cab.png` in `@stayverse/assets` |

---

# Phase 14 — Deferred depth

Continue Flutter parity for flows stubbed in Phase 13.

## Checklist

| Item | Status | Notes |
|------|--------|-------|
| Edit Profile | ✅ | `PUT /users/profile` |
| Change Password | ✅ | `PUT /users/update-password` |
| Notification toggle | ✅ | Device-token PATCH + optimistic UI |
| Wallet Add Funds | ✅ | Sheet → fund → Paystack → verify |
| Wallet Withdraw | ✅ | Banks → resolve → password → POST + success |
| Search API + map | ✅ | `GET /{type}/search` + SearchMapView markers |
| Agent Discover booking tabs | ✅ | Pending / Booked / Completed via `GET /booking/agent` |
| Agent add-listing wizards | ✅ | Condensed apartment/ride multipart create |
| KYC / Delete account / avatar upload | ✅ | NIN+selfie KYC, DELETE me, PATCH profile-picture |

## Ship order (this phase)

1. Edit Profile + Change Password + Notification toggle  
2. Add Funds + Withdraw  
3. Search API  
4. Agent booking tabs  
5. Add-listing forms  

---

# Phase 15 — Booking lifecycle & remaining parity

Close remaining Flutter gaps after Phase 14: booking details, agent accept/reject, reviews, host chat, agent wallet, search filters, chef create.

## Checklist

| Item | Status | Notes |
|------|--------|-------|
| User booking detail + cancel | ✅ | `/booking/[id]` — cancel `POST /booking/:id/cancel` |
| Agent booking detail + accept/reject | ✅ | Pending Accept / Booked Cancel → `PATCH /booking/:id/status` |
| Reviews list + leave review | ✅ | `GET/POST /{type}/:id/ratings\|rating` + Rating screen |
| Listing → Stream Chat | ✅ | Host chat from listing detail via Stream |
| Agent wallet | ✅ | Same fund/withdraw flow as user |
| Search filter UI | ✅ | Type / bedrooms / price chips |
| Chef create | ✅ | Condensed `POST /chef` profile |

## Ship order

1. Booking detail (user + agent) + status mutations  
2. Reviews  
3. Listing chat  
4. Agent wallet  
5. Search filters + chef create  

---

# Phase 16 — Unit & integration testing

Hybrid runners: **Vitest** for `@stayverse/core` (stores, API, hooks, coverage ≥70% on the Phase 16 surface); **jest-expo** for `@stayverse/ui` component tests and user/agent app integration flows. Root scripts: `pnpm test`, `pnpm test:coverage`. CI: `.github/workflows/test.yml` (repo root + `stayverse-expo/`) on push/PR to `main`.

## Checklist

| Item | Status | Notes |
|------|--------|-------|
| Vitest core stores + persist | ✅ | All Zustand stores + rehydration |
| API client / endpoints / RQ hooks | ✅ | Client interceptors, auth/catalog, login/profile/bookings |
| jest-expo UI components | ✅ | Button, TextField, Modal, Toast, EmptyState |
| App integration (3+3) | ✅ | user-app + agent-app mocked flows |
| Coverage ≥70% + CI | ✅ | `test:coverage` thresholds + GitHub Actions |
