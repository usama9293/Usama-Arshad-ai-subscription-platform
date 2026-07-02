# AI Subscription & Chat Platform

A backend system implementing two modules — an **AI Chat module** with usage-based quota tracking, and a **Subscription Bundle module** with tiered plans and simulated billing — built with **NestJS**, **TypeScript**, **PostgreSQL**, and **TypeORM**, following **Clean Architecture / Domain-Driven Design** principles.

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [API Endpoints](#api-endpoints)
- [Design Decisions](#design-decisions)
- [Testing](#testing)

---

## Architecture

This project follows **Clean Architecture**, organized as independent, self-contained modules (`users/`, `subscriptions/`, `chat/`), each internally layered as:

- **`domain/entities/`** — the core business objects. These aren't just data containers; they protect their own invariants. For example, `SubscriptionBundle.deductOne()` will throw rather than let `messagesUsed` exceed `maxMessages`. Business rules live here, not scattered across services.
- **`repositories/`** — the only layer that talks to the database (via TypeORM). Services never write raw queries directly; they call repository methods like `findActiveByUser()`. This means the persistence technology (Postgres/TypeORM) could be swapped without touching business logic.
- **`services/`** — orchestration. Decides _what_ to do (e.g. "check free quota, then bundles, then deduct"), delegating _how_ to store data to repositories and _what the rules are_ to entities.
- **`controllers/`** — thin HTTP adapters. They validate input (via DTOs) and delegate to services. No business logic lives here.
- **`dto/`** — request/response shapes with `class-validator` decorators, enforced by a global `ValidationPipe`.

Cross-module dependency: the `chat` module depends on `subscriptions`' exported `SubscriptionRepository` to check/deduct bundle quota — this is the one intentional coupling, since chat usage and subscription bundles are inherently related concepts.

## Tech Stack

| Tool              | Why                                                                     |
| ----------------- | ----------------------------------------------------------------------- |
| NestJS            | Built-in DI + module system maps naturally onto DDD bounded contexts    |
| TypeScript        | Type safety across domain models and API contracts                      |
| PostgreSQL        | Relational integrity for usage/quota tracking (unique constraints, FKs) |
| TypeORM           | Decorator-based entities, migrations support                            |
| class-validator   | Request validation at the API boundary                                  |
| ESLint + Prettier | Code consistency                                                        |

## Project Structure

```
src/
├── users/
│   ├── entities/user.entity.ts
│   ├── dto/create-user.dto.ts
│   └── users.controller.ts / users.module.ts
├── chat/
│   ├── domain/
│   │   ├── entities/ (chat-message.entity.ts, monthly-usage.entity.ts)
│   │   └── errors/ (quota-exceeded.exception.ts)
│   ├── repositories/ (chat-message.repository.ts, monthly-usage.repository.ts)
│   ├── services/ (chat.service.ts, mock-openai.service.ts)
│   ├── dto/ask-question.dto.ts
│   └── chat.controller.ts / chat.module.ts
├── subscriptions/
│   ├── domain/
│   │   ├── entities/subscription-bundle.entity.ts
│   │   ├── pricing.ts
│   │   └── errors/subscription-not-found.exception.ts
│   ├── repositories/subscription.repository.ts
│   ├── services/ (subscriptions.service.ts, billing-simulator.service.ts)
│   ├── dto/create-subscription.dto.ts
│   └── subscriptions.controller.ts / subscriptions.module.ts
├── shared/
│   ├── errors/domain-exception.ts
│   └── filters/all-exceptions.filter.ts
└── app.module.ts / main.ts
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### 1. Clone and install

```bash
git clone https://github.com/usama9293/Usama-Arshad-ai-subscription-platform.git
cd ai-subscription-platform
npm install
```

### 2. Create the database

```bash
psql -U postgres
CREATE DATABASE ai_subscription_platform;
\q
```

### 3. Configure environment

Copy `.env.example` to `.env` and fill in your local Postgres credentials:

```bash
cp .env.example .env
```

### 4. Run

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`. Tables are auto-created via TypeORM's `synchronize: true` (dev-only setting — in production this would be disabled in favor of migrations).

## API Endpoints

### Users

| Method | Endpoint     | Body                  |
| ------ | ------------ | --------------------- |
| POST   | `/users`     | `{ "email": string }` |
| GET    | `/users/:id` | —                     |

### Subscriptions

| Method | Endpoint                      | Body                                                                                                                   |
| ------ | ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| POST   | `/subscriptions`              | `{ "userId": uuid, "tier": "BASIC"\|"PRO"\|"ENTERPRISE", "billingCycle": "MONTHLY"\|"YEARLY", "autoRenew"?: boolean }` |
| GET    | `/subscriptions/user/:userId` | —                                                                                                                      |
| POST   | `/subscriptions/:id/cancel`   | —                                                                                                                      |
| POST   | `/subscriptions/billing/run`  | Manually triggers the billing simulation (auto-renew + random payment failure) across all due subscriptions            |

### Chat

| Method | Endpoint                | Body                                     |
| ------ | ----------------------- | ---------------------------------------- |
| POST   | `/chat/ask`             | `{ "userId": uuid, "question": string }` |
| GET    | `/chat/history/:userId` | —                                        |

### Example: quota exceeded response

```json
{
  "code": "QUOTA_EXCEEDED",
  "message": "User <id> has exhausted their free quota and has no active subscription bundle with remaining messages.",
  "statusCode": 402,
  "timestamp": "2026-07-02T10:00:00.000Z",
  "path": "/chat/ask"
}
```

## Design Decisions

**Free quota reset without a cron job.** Monthly free usage is stored as one row per `(userId, yearMonth)` rather than a single mutable counter. "Resetting on the 1st" is achieved simply by there being no row for the new month yet — `findOrCreateForCurrentMonth()` creates a fresh one on first use. This avoids scheduled reset jobs entirely and is inherently race-safe per month.

**"Latest remaining quota" bundle selection.** When free quota is exhausted, active bundles with remaining quota are considered in order of `renewalDate` descending — the bundle valid furthest into the future is used first, preserving shorter-lived bundles as a fallback. This interpretation was chosen because it maximizes the usefulness of longer-term purchases; the alternative (draining soon-to-expire bundles first) is also defensible and could be swapped by changing one query's sort order.

**Enterprise = unlimited via `null`, not a large number.** `maxMessages: null` makes "unlimited" an explicit, unambiguous state rather than an arbitrary ceiling like `999999`.

**Quota resolved before the AI call, deducted after.** `ChatService.askQuestion()` determines which source (free/bundle) will pay for a message and validates it has room _before_ invoking the mocked OpenAI call, but only calls `.deductOne()` afterward. This mirrors real-world behavior — a failed AI call shouldn't consume a user's quota.

**402 Payment Required for quota errors.** Chosen over 403 Forbidden because the semantics are more precise: the request itself is valid, but the user needs to pay/subscribe to proceed.

**Structured errors globally, not just for quota.** A single `AllExceptionsFilter` normalizes every error response (validation failures, 404s, quota errors, unexpected crashes) into the same `{ code, message, statusCode, timestamp, path }` shape, so API consumers only ever need to handle one error format.

**Cancellation preserves history.** Cancelling a subscription sets `status: CANCELLED` and `autoRenew: false` — it never deletes the row or resets `messagesUsed`, satisfying "preserves usage history" while also excluding it from future quota deduction and billing runs.

**Billing simulation as a manually-triggered endpoint, not a real cron job.** `POST /subscriptions/billing/run` finds all active, auto-renew subscriptions past their `renewalDate`, then simulates a 90% payment success rate — renewing (resetting usage, extending dates) or marking `INACTIVE` on failure. A manual trigger keeps the behavior easy to observe and test; in production this would run on `@nestjs/schedule` as a daily cron job.

**Denormalized `messagesUsed` counter on bundles.** Kept on the bundle row itself (updated transactionally on each deduction) rather than computed live via `COUNT()` on `chat_messages`, for fast quota checks on every chat request. `chat_messages` still records `bundleId`/`source` per message, so the full audit trail remains reconstructable independently.

## Testing

Manually verified via Postman:

1. Create user → create PRO subscription → ask 4 questions (first 3 from free quota, 4th from bundle) → check history → cancel subscription → confirm structured 402 on further requests once all quota is exhausted.
2. Billing simulation run against subscriptions with `renewalDate` in the past, confirming renewal/failure branching.
