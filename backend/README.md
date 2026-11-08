# Taxt və Qılınc — SLG Backend

Spring Boot 3 / Java 21 backend foundation for the existing browser prototype. This is an early development foundation, not a production-ready MMO.

## Stack
- Spring Boot REST API
- MySQL for durable player/game state
- Redis reserved for cache, sessions and short-lived coordination
- RabbitMQ reserved for asynchronous game jobs and domain events
- Spring Security, BCrypt password hashing and signed JWT access tokens

## Run locally (computer required)
This section requires a computer with Docker, Java 21 and Maven. It cannot be completed on an iPhone alone.

1. Copy `.env.example` to `.env` and replace the example passwords and JWT secret with private values.
2. From this directory, start the dependencies: `docker compose up -d`.
3. Load the variables from `.env` into the shell before starting Spring Boot. On macOS/Linux:
   ```bash
   set -a
   . ./.env
   set +a
   mvn spring-boot:run
   ```
   On Windows PowerShell, set the variables in the terminal (or use a local environment loader) before running `mvn spring-boot:run`. Docker Compose reads `.env` automatically, but Spring Boot does not automatically load that file.
4. Check `http://localhost:8080/actuator/health`.

## Authentication API

Register: `POST /api/v1/auth/register`
```json
{ "email": "player@example.com", "nickname": "Sərkərdə", "password": "use-a-long-unique-password" }
```

Login: `POST /api/v1/auth/login`
```json
{ "email": "player@example.com", "password": "use-a-long-unique-password" }
```

Both return a short-lived JWT access token. Send it on protected requests as:
`Authorization: Bearer <accessToken>`

Current player: `GET /api/v1/auth/me`

Player city: `GET /api/v1/city` (requires the Bearer token). New accounts receive a level-1 starter city with initial gold, wood, stone, food and iron. Resource values are read from the server database; the browser must not be treated as authoritative.

Health: `GET /actuator/health`

## Security and production readiness
- Passwords are stored as BCrypt hashes; plaintext passwords are never persisted.
- JWT signing secret must be private, randomly generated and supplied through `JWT_SECRET_BASE64` in production. The checked-in default is development-only and must never be used in a public deployment.
- HTTPS, email verification, refresh-token rotation/revocation, login rate limiting, account recovery and abuse protection are still required before public launch.
- Never expose MySQL, Redis or RabbitMQ publicly in production.
- Do not store authoritative resources, troops or battle outcomes in the browser. The server must validate every state-changing command.
- Add Flyway migrations before production; Hibernate schema auto-update is currently for early development only.
- Local Docker Compose is for development. Production hosting and its free-tier limits must be checked separately.
- Redis and RabbitMQ dependencies/configuration are present, but gameplay queues and cache operations have not yet been implemented.
- The current game client is Three.js in a browser. Unity is a possible later client; both should use the same versioned API contract.

## Keep upgrade (server-authoritative)

Start an upgrade: `POST /api/v1/city/keep/upgrade` with the player's Bearer token and no request body. The server calculates the next-level resource costs, checks the player's stored balances, deducts the resources and records the finish timestamp. The keep level changes only after that timestamp has passed; `GET /api/v1/city` finalizes a completed upgrade and returns the updated city state.

Development balance for target level N:
- Gold: 500 × N
- Wood: 700 × N
- Stone: 600 × N
- Food: 400 × N
- Iron: 250 × N
- Duration: 30 × N seconds (temporary development timing)
- Maximum keep level: 30

The city row is pessimistically locked while a state-changing upgrade is processed to reduce concurrent double-spend races. This is an initial single-city implementation; building queues, production, speed-ups, migrations, economy balancing and load tests remain future work.

## Offline resource production

Resources are accrued on the server whenever the authenticated city is read or a city command is submitted. The elapsed time is calculated from the persisted `lastResourceUpdateAt` timestamp, so production continues while the player is offline; no background timer or client clock is trusted. Fractional production is retained between requests so frequent refreshes do not discard fractions.

Temporary development production at keep level 1 (per hour):
- Gold: 20
- Wood: 45
- Stone: 30
- Food: 60
- Iron: 12

Each keep level above level 1 increases production by 10%. Each resource has a storage cap of 100,000. When the cap is reached, excess production is discarded. These are prototype balancing values, not final live-game economics.

The city API response includes `resourceStorageCap` and `lastResourceUpdateAt`. Unit tests cover offline accrual, fractional accumulation, cap enforcement and backwards clock input. Production rates, upgrades to resource buildings, boosts, protection against clock manipulation at infrastructure level and load testing remain future work.

Production is split at a keep-upgrade completion timestamp when the player has been offline: elapsed time before completion uses the old keep level, and time after completion uses the new level. Resource arithmetic is capped before addition to avoid integer overflow.

## Resource production buildings

The city has four server-owned production buildings, each starting at level 1:
- `WOODCUTTER` — increases wood production
- `QUARRY` — increases stone production
- `FARM` — increases food production
- `IRON_MINE` — increases iron production

Upgrade one with `POST /api/v1/city/buildings/{building}/upgrade`, using the Bearer token. The path key is case-insensitive. The server checks and deducts the costs; the building upgrade takes 20 seconds per target level in this development balance. Each building is capped at level 20. Target level N costs N×100 gold, N×250 wood, N×150 stone, N×100 food and N×50 iron. Each level above 1 increases that building's resource production by 25%.

The city response includes each building level and its upgrade completion timestamp. Offline production is split at building and keep upgrade completion times so a new production bonus is applied only after the corresponding upgrade completes. These timings and prices are provisional. The next step is to expose these controls in the browser city UI and then tune the economy.
