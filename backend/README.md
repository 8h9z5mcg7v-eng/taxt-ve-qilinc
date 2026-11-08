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
