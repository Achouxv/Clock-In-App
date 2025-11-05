# Worktime Monorepo

A cross-platform time tracking workspace for stand-building crews. The monorepo hosts a NestJS REST API and an Expo (React Native) mobile app with shared configuration packages.

## Repository Structure

```
worktime/
  apps/
    api/        # NestJS backend
    mobile/     # Expo mobile application
  packages/
    config/     # Shared constants and helpers
    tsconfig/   # Shared TypeScript configurations
```

## Prerequisites

- Node.js 18+
- npm 10+
- Docker + Docker Compose

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` in the repository root and adjust as needed:

   ```bash
   cp .env.example .env
   ```

   Supported environment variables:

   | Variable | Description | Default |
   | --- | --- | --- |
   | `DATABASE_URL` | PostgreSQL connection string | `postgres://worktime:worktime@localhost:5432/worktime` |
   | `DB_HOST` | Database host | `localhost` |
   | `DB_PORT` | Database port | `5432` |
   | `DB_USERNAME` | Database username | `worktime` |
   | `DB_PASSWORD` | Database password | `worktime` |
   | `DB_NAME` | Database name | `worktime` |
   | `HOURLY_RATE_DEFAULT` | Default hourly rate for new users | `0` |
   | `TRAVEL_ROUNDING` | Travel-hour rounding strategy (`fractional`, `floor`, or `nearest_half`) | `fractional` |
   | `TIMEZONE_DEFAULT` | Default timezone identifier | `Europe/Rome` |

3. **Start PostgreSQL**

   ```bash
   npm run db:up
   ```

4. **Run database migrations**

   ```bash
   npm run migration:run --workspace=apps/api
   ```

5. **Start development servers**

   Launch both the API and Expo app (placeholder commands until feature development):

   ```bash
   npm run dev
   ```

   You can also run each individually:

   ```bash
   npm run start:dev --workspace=apps/api
   npm run start --workspace=apps/mobile
   ```

## Additional Scripts

- `npm run db:down` – stop and remove the database container.
- `npm run db:reset` – tear down and recreate the database container.
- `npm run migration:generate --workspace=apps/api -- --name <migration-name>` – generate a new TypeORM migration.
- `npm run migration:run --workspace=apps/api` – apply migrations.
- `npm run test --workspace=apps/api` – execute unit tests.
- `npm run test:e2e --workspace=apps/api` – execute end-to-end tests.

## Shared Configuration Package

The `@worktime/config` package exposes reusable constants:

- Time windows (`LUNCH_WINDOW`, `DINNER_WINDOW`)
- Allowance amounts (`ALLOWANCE_LUNCH`, `ALLOWANCE_DINNER`, `ALLOWANCE_FOREIGN_DAILY`)
- Travel rounding enum (`TravelRounding`)
- Region helper (`isInsideLombardy`)

These can be imported from `@worktime/config` within workspace packages.
