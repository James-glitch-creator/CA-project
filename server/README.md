# ARCH-LAB API (Node.js + Express + MySQL)

Backend for the Architecture Simulator frontend. Provides persistence for
saved assembly programs, cache-config presets, and saved Performance
Analysis run reports.

**No accounts, no login.** Every visitor shares the same public library —
programs, cache presets and reports saved by anyone are visible to everyone.

## Setup

1. Install MySQL 8+ and create the schema:
   ```bash
   mysql -u root -p < schema.sql
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   # edit .env with your DB credentials
   ```
3. Install dependencies and (optionally) seed a sample program:
   ```bash
   npm install
   npm run seed
   ```
4. Run the API:
   ```bash
   npm run dev       # http://localhost:4000, auto-reloads
   # or
   npm start
   ```

## API overview

All routes are prefixed with `/api` and are open — no authorization header
required.

| Method | Route                  | Description                          |
|--------|-------------------------|--------------------------------------|
| GET    | `/health`               | DB connectivity check                |
| GET    | `/programs`              | List saved programs                  |
| POST   | `/programs`              | Save a new program                   |
| GET    | `/programs/:id`          | Get one program                      |
| PUT    | `/programs/:id`          | Update a program                     |
| DELETE | `/programs/:id`          | Delete a program                     |
| GET    | `/runs`                  | List saved performance reports       |
| POST   | `/runs`                  | Save a performance report            |
| GET    | `/runs/:id`              | Get one report (incl. full log)      |
| DELETE | `/runs/:id`              | Delete a report                      |
| GET    | `/cache-configs`         | List saved cache presets             |
| POST   | `/cache-configs`         | Save a cache preset                  |
| DELETE | `/cache-configs/:id`     | Delete a cache preset                |

## Schema

See [schema.sql](schema.sql): `programs`, `cache_configs`, `runs`
(the run log — fetch/decode/execute steps — is stored as a `JSON` column).
