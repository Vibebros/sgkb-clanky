# Clanky

A Django- and Next.js-based analytics playground for SGKB transaction data. The backend exposes a GraphQL API and Celery-powered enrichment jobs, while the frontend renders dashboards built on Tremor components.

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Initial Setup](#initial-setup)
- [Make Targets](#make-targets)
- [Backend Workflow](#backend-workflow)
- [CSV Data Import](#csv-data-import)
- [Frontend Workflow](#frontend-workflow)
- [Environment Variables](#environment-variables)
- [Testing & Quality](#testing--quality)
- [Troubleshooting](#troubleshooting)
- [Project Structure](#project-structure)

## Overview
Clanky centralises SGKB transaction data and enrichment logic. A Django 5 GraphQL API serves the data, Celery tasks backfill metadata such as company logos, and a Next.js 15 dashboard provides interactive analytics. Redis backs the asynchronous task queue and the project ships with a SQLite database for local development.

## Architecture
- **Django 5 + Graphene**: GraphQL endpoint available at `http://localhost:8000/graphql/` (GraphiQL enabled).
- **Celery + Redis**: Background task processing for enrichment jobs (`sgkb/finance/tasks.py`).
- **Next.js 15 / React 19**: Tailwind-powered frontend in `frontend/` for analytics views.
- **SQLite (dev)**: Default database, easily swappable via Django settings.
- **Docker**: Recommended way to run the local Redis instance via the provided make target.

## Prerequisites
- Python 3.11+ with `pip`
- Node.js 20+ with `npm` (or `bun` if you prefer)
- Docker Desktop (or a local Redis installation)
- GNU Make and Git

## Initial Setup
1. **Clone the repository**
   ```bash
   git clone https://github.com/sgkb/sgkb-clanky.git
   cd sgkb-clanky
   ```
2. **Create a virtual environment**
   ```bash
   make venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```
3. **Install backend dependencies**
   ```bash
   make install
   ```
4. **Configure environment variables**
   - Copy `.env` (or create one) at the repository root.
   - Populate the keys listed in [Environment Variables](#environment-variables). Values override via real environment variables.
5. **Apply database migrations**
   ```bash
   make migrate
   ```
6. **(Optional) Create an admin user**
   ```bash
   make user
   ```

## Make Targets
The Makefile in the repository root drives the common backend workflows.

| Target | Description |
| ------ | ----------- |
| `make venv` | Create `.venv` virtual environment using system Python. |
| `make install` | Install Python dependencies from `requirements.txt` into the active environment. |
| `make server` | Run the Django development server on `http://127.0.0.1:8000/`. |
| `make migrations` | Generate Django migrations from model changes. |
| `make migrate` | Apply migrations to the local database. |
| `make user` | Launch `createsuperuser` to provision a Django admin account. |
| `make redis` | Start a Redis 7 container (detached) bound to `127.0.0.1:6379`. |
| `make worker` | Start the Celery worker (with beat) for async tasks. Requires Redis running. |
| `make shell` | Open the Django shell inside the virtual environment. |

Stop the Redis container when finished:
```bash
docker stop redis && docker rm redis
```

## Backend Workflow
1. Start Redis: `make redis`
2. Run Celery worker: `make worker`
3. Launch Django server: `make server`
4. Visit `http://localhost:8000/graphql/` for the GraphiQL IDE. Example query:
   ```graphql
   query RecentTransactions {
     bankTransactions(startDate: "2025-03-21", endDate: "2025-03-29") {
       id
       valDate
       amount
     }
   }
   ```
5. Access the Django admin at `http://localhost:8000/admin/` using the superuser created earlier.

Celery enrichment tasks (e.g., `enrich_transaction_logos`) rely on the `LOGO_DEV_API_KEY` and will progressively enrich transactions with logo metadata.

## CSV Data Import
Manually importing transaction exports is handled through the Django admin so that business users can refresh datasets without touching the codebase.

1. Ensure the backend is running (`make server`) and you are authenticated at `http://localhost:8000/admin/`.
2. Open <http://127.0.0.1:8000/admin/finance/banktransaction/upload-csv/> to reach the direct upload form (also linked from the **Bank transactions** changelist).
3. Upload the latest `categories.csv` export (UTF-8 encoded) and submit the form. The importer streams rows into `BankTransaction` records and will create `Catagory` entries on-the-fly if a `category` column is present.
4. Watch the success banner in the admin for confirmation, or any error message with details about rejected rows.

The parser accepts the SGKB export headers used in production (case-sensitive). Common columns include:
```
TRX_ID, TRX_TYPE_ID, TRX_TYPE_SHORT, TRX_TYPE_NAME,
BUCHUNGS_ART_SHORT, BUCHUNGS_ART_NAME,
VAL_DATE, TRX_DATE, DIRECTION, AMOUNT, TRX_CURRY_ID, TRX_CURRY_NAME,
MONEY_ACCOUNT_NAME, MACC_TYPE, PRODUKT, KUNDEN_NAME,
TEXT_SHORT_CREDITOR, TEXT_CREDITOR, TEXT_SHORT_DEBITOR, TEXT_DEBITOR,
POINT_OF_SALE_AND_LOCATION, ACQUIRER_COUNTRY_ID, ACQUIRER_COUNTRY_NAME,
CARD_ID, CRED_ACC_TEXT, CRED_IBAN, CRED_ADDR_TEXT, CRED_REF_NR, CRED_INFO,
category
```
Values missing from the CSV default to blanks, and decimal values may use either dot or comma separators. After a successful import you can optionally run Celery enrichment (`make worker`) to attach company logos to the new transactions.


## Frontend Workflow
1. Install dependencies (one-time):
   ```bash
   cd frontend
   npm install  # or: bun install
   ```
2. Start the Next.js dev server:
   ```bash
   npm run dev
   ```
3. Visit `http://localhost:3000` to explore the analytics dashboards. The app assumes the Django API is reachable at `http://localhost:8000`.

Useful scripts:
- `npm run lint` — run Biome checks.
- `npm run format` — format source files with Biome.
- `npm run build` — production build with Turbopack.

## Environment Variables
Define variables in `.env` (loaded automatically by `sgkb/sgkb/settings.py`):

| Key | Required | Description |
| --- | -------- | ----------- |
| `LOGO_DEV_API_KEY` | Yes (for logo enrichment) | Token for https://logo.dev used by `finance.utils.logo`. |
| `OPENAI_API_KEY` | Optional | Enables OpenAI-backed features in `ai_manager`. |

Variables already present in the environment take precedence over `.env`.

## Testing & Quality
- Backend tests: `cd sgkb && python manage.py test`
- Lint/format frontend: `cd frontend && npm run lint`
- Consider running Celery tasks in isolation for diagnostics:
  ```bash
  cd sgkb
  python manage.py shell
  >>> from finance.tasks import enrich_transaction_logos
  >>> enrich_transaction_logos.delay()
  ```

## Troubleshooting
- **Redis container fails to start**: Ensure no local Redis is already bound to port 6379. Stop with `docker stop redis` before re-running.
- **Celery cannot connect to Redis**: Confirm `make redis` is running and the worker has been restarted after configuration changes.
- **Stale virtual environment**: Delete `.venv` and run `make venv` again if dependencies drift.
- **GraphQL errors**: Inspect server logs from `make server` for the resolver stack trace.

## Project Structure
```text
.
├── Makefile              # Backend automation targets
├── frontend/             # Next.js 15 analytics app
├── sgkb/                 # Django project and apps
│   ├── finance/          # Banking domain models, tasks, GraphQL schema
│   └── sgkb/             # Project settings, URL routing, GraphQL schema
├── requirements.txt      # Python dependencies
├── package.json          # Root-level JS dependencies (maps, shared libs)
└── .env                  # Local configuration (not tracked)
```