# Taxt və Qılınc — SLG Backend

Spring Boot 3 / Java 21 backend foundation for the existing browser prototype. This is a foundation, not a production-ready MMO yet.

## Stack
- Spring Boot REST API
- MySQL for durable player/game state
- Redis reserved for cache, sessions and short-lived coordination
- RabbitMQ reserved for asynchronous game jobs and domain events

## Run dependencies
1. Copy `.env.example` to `.env` and replace every example password.
2. From this directory run `docker compose up -d`.
3. Install Java 21 and Maven, then run `mvn spring-boot:run`.

API: `POST /api/v1/players`
```json
{ "nickname": "Sərkərdə" }
```

Health: `GET /actuator/health`

## Important
- Never expose MySQL, Redis or RabbitMQ publicly in production.
- Do not store authoritative resources, troops or battle outcomes in the browser. The server must validate every state-changing command.
- Before public launch add authentication, authorization, rate limits, database migrations (Flyway), idempotency, audit logs, backups and anti-cheat validation.
- Local Docker Compose is for development. Production hosting and its free-tier limits must be checked separately.
- The current game client is Three.js in a browser. Unity is a possible later client; both should use the same versioned API contract.