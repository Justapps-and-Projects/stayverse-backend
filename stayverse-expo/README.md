# Stayverse Expo Monorepo

Flutter → Expo (React Native) migration workspace for **Stayverse User** and **Stayverse Agent**.

## Structure

```
stayverse-expo/
├── apps/
│   ├── user-app/     # Expo app — customer / rider facing
│   └── agent-app/    # Expo app — agent / provider facing
├── packages/
│   ├── ui/           # @stayverse/ui — design system (Phase 2+)
│   ├── core/         # @stayverse/core — API, stores, hooks, types
│   ├── config/       # shared ESLint / Prettier / TSConfig
│   └── assets/       # shared fonts, icons, lottie
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

## Requirements

- Node 20+
- [pnpm](https://pnpm.io/) 9+
- Expo CLI / EAS CLI (`npm i -g eas-cli`)

## Setup

```bash
cd stayverse-expo
pnpm install
```

## Run apps

```bash
# User app (Expo Router)
pnpm dev:user

# Agent app
pnpm dev:agent
```

Then press `i` (iOS simulator), `a` (Android), or scan the QR code with Expo Go.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev:user` | Start user app Metro bundler |
| `pnpm dev:agent` | Start agent app Metro bundler |
| `pnpm lint` | Lint all packages/apps via Turborepo |
| `pnpm typecheck` | TypeScript check all packages/apps |
| `pnpm build:user` | EAS production build for user app |
| `pnpm build:agent` | EAS production build for agent app |

## Shared packages

Import from apps:

```ts
import { APP_NAME } from "@stayverse/core";
import { StayversePlaceholder } from "@stayverse/ui";
```

## EAS

Each app has `eas.json` with `development`, `preview`, and `production` profiles.

```bash
cd apps/user-app && eas init   # once — replaces placeholder projectId in app.json
cd apps/agent-app && eas init
```

## Bundle IDs (existing store apps)

| App | iOS | Android |
|-----|-----|---------|
| User | `com.stayverse.app` | `com.stayversepro.app` |
| Agent | `com.stayverse.agent.app` | `com.stayverse.agent.app` |

## Phase status

- [x] Phase 1 — Monorepo & scaffolding
- [x] Phase 2 — Design system (`@stayverse/ui`, kitchen sink at `/dev/components`)
- [x] Phase 3 — Navigation & auth shell
- [x] Phase 4 — Networking (Axios + React Query + env)
- [x] Phase 5 — State layer (Zustand + RQ hooks + [MIGRATION_MAP.md](./MIGRATION_MAP.md))
- [x] Phase 6 — Local storage (MMKV + SecureStore — [MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md))
- [x] Phase 7 — Realtime (Socket.IO singleton + auth lifecycle — see [MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-7--socketio))
- [x] Phase 8 — Firebase (FCM + Analytics wrapper — [MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-8--firebase-core-messaging-analytics))
- [x] Phase 9 — Stream Chat (inbox + channel screens — [MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-9--stream-chat))
- [x] Phase 10 — Maps & geolocation ([MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-10--maps--geolocation))
- [x] Phase 11 — Media & misc UI ([MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-11--media--misc-ui))
- [x] Phase 12 — Error monitoring / Sentry ([MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-12--error-monitoring-sentry))
- [x] Phase 13 — Feature screen port ([MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-13--feature-screen-port))
- [x] Phase 14 — Deferred depth (profile/wallet/search/agent + KYC/delete/avatar) ([MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-14--deferred-depth))
- [x] Phase 15 — Booking lifecycle & remaining parity ([MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-15--booking-lifecycle--remaining-parity))
- [x] Phase 16 — Unit & integration testing ([MIGRATION_AUDIT.md](./MIGRATION_AUDIT.md#phase-16--unit--integration-testing))

