# Feature Flag Engine

A minimal feature flag system built with Next.js + MongoDB. Supports global defaults, user/group/region overrides, and runtime evaluation with predictable precedence.

## Quick Start

1. Install dependencies

```bash
npm install
```

2. Configure environment

Create a `.env.local` file:

```
MONGODB_URI="<your-mongodb-connection-string>"
```

3. Run the app

```bash
npm run dev
```

Open the admin UI at `http://localhost:3000`.

## API Overview

- `GET /api/flags` list all feature flags
- `POST /api/flags` create a feature flag
- `GET /api/flags/:key` get a flag + overrides
- `PATCH /api/flags/:key` update global state/description
- `DELETE /api/flags/:key` delete a flag
- `POST /api/flags/:key/overrides` create an override
- `PATCH /api/overrides/:id` update override
- `DELETE /api/overrides/:id` delete override
- `POST /api/evaluate` evaluate a flag for a context

## Evaluation Precedence

When evaluating a feature:

1. If a **user** override exists, use it
2. Else if a **group** override exists, use it
3. Else if a **region** override exists, use it
4. Otherwise use the **global default**

## Example Evaluation Payload

```json
{
  "key": "new_checkout",
  "userId": "u_123",
  "groupId": "g_premium",
  "region": "EU"
}
```

## Assumptions

- No authentication (single-user proof of concept).
- Overrides are unique per `(featureKey, type, target)`.
- Region overrides are treated with lower precedence than user/group overrides.

## Tradeoffs

- In-memory cache is short-lived and not shared across server instances.
- No advanced targeting rules (percentage rollouts, attributes).
- No tests included yet (timeboxed weekend scope).

## Known Limitations / Rough Edges

- Cache invalidation happens only on mutations within the same instance.
- UI is intentionally minimal and admin-focused.

## What I’d Do Next With More Time

- Add unit tests for evaluation precedence and edge cases.
- Add authentication + roles.
- Add SDK client and CLI.
- Support percentage rollouts and attribute-based targeting.

## Deployment (Vercel)

- Set `MONGODB_URI` in Vercel Environment Variables.
- Deploy as a standard Next.js app.
