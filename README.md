# Maridimamba - Village Group Money Management Application

A full-stack, production-grade web application built to manage rotating savings and community group money pools (approx. 20 members, starting with ₹50,000+).

## 🌟 Core Philosophy
> **"The leader decides. The application calculates, validates, records, and reports. All members have full financial transparency."**

- **Group Leader (`LEADER`)**: Full operational authority to decide monthly lending amounts, chunk sizes, member chunk allocations, due dates, interest amounts, payment recording, and cycle closures.
- **Group Members (`MEMBER`)**: Full visibility to inspect group pools, active cycles, loan statuses, the complete financial ledger, and monthly statements. Mutation buttons are locked in read-only mode for non-leaders.
- **Double-Entry Financial Ledger**: Immutable record of every single rupee entering or leaving the group (`OPENING_BALANCE`, `LOAN_DISBURSEMENT`, `LOAN_REPAYMENT`, `OTHER_INCOME`, `OTHER_EXPENSE`).

---

## 🏗️ Architecture

```text
               +---------------------------------------------+
               |        Web / Mobile Browser Clients         |
               +---------------------------------------------+
                                      |
                     HTTP / JSON REST | (Port 5173 -> 8080)
                                      v
               +---------------------------------------------+
               |             React 18 + Vite                 |
               |  (Tailored Indian Village Community Theme)  |
               +---------------------------------------------+
                                      |
                       Vite Proxy /api/* -> :8080
                                      v
               +---------------------------------------------+
               |        Java 17 Spring Boot Backend          |
               |---------------------------------------------|
               | - Security Filter & JWT Authentication      |
               | - Role-Based Access Control (LEADER/MEMBER) |
               | - Domain Logic: Cycles, Chunks, Repayments  |
               | - Ledger Engine (Double-Entry Balance)      |
               | - Audit Logger                              |
               +---------------------------------------------+
                                      |
                         Spring Data JPA & Flyway
                                      v
               +---------------------------------------------+
               |            PostgreSQL Database              |
               |   (Dual Support: Postgres & H2 PG-Mode)     |
               +---------------------------------------------+
```

---

## 🛠️ Technology Stack

- **Backend:** Java 17, Spring Boot 3.2.5, Spring Security 6, Spring Data JPA, Hibernate ORM
- **Database:** PostgreSQL (with Flyway automated migrations)
- **Security:** Stateless JWT Authentication with BCrypt password hashing and RBAC
- **Financial Arithmetic:** Java `BigDecimal` (zero floating-point inaccuracies)
- **Frontend:** React 18, Vite, Modern Vanilla CSS Design Tokens, Lucide Icons
- **Formatting:** Indian Rupee formatting (`₹64,500`), Indian Number System

---

## 🔑 Default Test Credentials

| Role | Username | Password | Capabilities |
| :--- | :--- | :--- | :--- |
| **Group Leader** | `leader` | `admin123` | Full control: Start/close months, disburse chunks, record repayments, manage members |
| **Group Member** | `member` | `member123` | Full transparency: Inspect group balance, cycle progress, loans, ledger, reports |

*(Convenient one-click demo login buttons are available right on the login screen).*

---

## 📋 Prerequisites

- **Java JDK:** 17 or higher
- **Node.js:** 18 or 20+
- **npm:** 9+
- **PostgreSQL:** 14+ (or Docker, or use out-of-the-box local dev profile)

---

## 🚀 How to Run Locally

### Option A: Out-of-the-Box (Instant Zero-Friction)

The application comes preconfigured with a persistent, file-based PostgreSQL-compatibility database mode and Flyway seed data (20 members, initial ₹50,000 balance, August 2026 completed cycle, September 2026 active cycle).

1. **Start the Backend:**
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```
   *Backend starts on `http://localhost:8080`.*

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *Frontend starts on `http://localhost:5173`.*

3. Open **`http://localhost:5173`** in your browser.

---

### Option B: Using Native PostgreSQL or Docker

1. **Start PostgreSQL with Docker Compose:**
   ```bash
   docker compose up -d
   ```
   *(Or start your local PostgreSQL instance on port 5432 with database `maridimamba`, user `postgres`, password `postgrespassword`)*.

2. **Run Backend with PostgreSQL profile:**
   ```bash
   cd backend
   SPRING_PROFILES_ACTIVE=postgres \
   DB_HOST=localhost \
   DB_PORT=5432 \
   DB_NAME=maridimamba \
   DB_USERNAME=postgres \
   DB_PASSWORD=postgrespassword \
   ./mvnw spring-boot:run
   ```

3. **Run Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🌍 Environment Variables Reference

| Variable | Default | Description |
| :--- | :--- | :--- |
| `SPRING_PROFILES_ACTIVE` | `dev` | Profile to activate (`dev` or `postgres`) |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `maridimamba` | PostgreSQL database name |
| `DB_USERNAME` | `postgres` | Database username |
| `DB_PASSWORD` | `postgres` | Database password |
| `APP_JWT_SECRET` | *(64-byte key)* | Secret key for signing JWT tokens |
| `APP_JWT_EXPIRATION_MS` | `86400000` (24h) | JWT Token lifespan in milliseconds |

---

## 📊 Database Schema & Migrations

Database tables are managed via Flyway under [`backend/src/main/resources/db/migration/`](file:///Users/venkateshkarri/Documents/VibeCode/maridimamba/backend/src/main/resources/db/migration/):

- `users`: User authentication, roles (`LEADER`, `MEMBER`), credentials.
- `members`: Village members directory (Ravi, Suresh, Kumar, etc.). Inactive members preserve historical loans.
- `monthly_cycles`: Monthly rotating cycles (opening balance, lending amount, reserve, chunk amount, closing balance, status).
- `loans`: Individual loans/chunks assigned to members (principal, interest, total due, amount paid, remaining, due date, status: `PENDING`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`).
- `payments`: Individual payment records (principal portion, interest portion, recorded by, timestamp, notes).
- `ledger_transactions`: Immutable double-entry financial ledger recording all cash flows with running balance.
- `audit_logs`: Audit logs tracking user actions, entity types, previous states, and modified states.

---

## 🧪 Running Automated Tests

Execute the comprehensive financial logic and RBAC test suites:

```bash
cd backend
./mvnw test
```

### Verified Test Cases (21 Tests Passing):
1. Reserve Calculation (`Reserve = Available Balance - Lending Amount`)
2. Chunk Split Calculation (`₹60,000 / ₹5,000 = 12 Chunks`)
3. Loan Assignment & Interest Calculation (`Total Due = Principal + Interest`)
4. Full Payment Recording & Status Transition to `PAID`
5. Partial Payments & Multiple Installments on a Single Loan
6. Excess Payment Prevention (Cannot exceed remaining loan balance)
7. Lending Amount Guard (Cannot exceed available group funds)
8. Ledger Running Balance Consistency & Outflow/Inflow Tracking
9. RBAC Transparency: Group Member can view all dashboard metrics, members, and ledger
10. RBAC Mutation Guard: Group Member receives `403 Forbidden` on payment/cycle mutations
11. RBAC Leader Access: Leader can perform full financial mutations
12. Single Chunk Per Member Per Month Rule: Prevents assigning multiple chunks to the same member in the same cycle
13. Batch Assignment Deduplication: Rejects batch requests containing duplicate member IDs
14. Auction-Based Interest Determination: Correctly assigns winning auction bid to total repayment due
15. Cycle Closure Validation: Cannot close cycle with pending unpaid loans
16. Manual Ledger Transactions: Auditable balance tracking for external events
17. Liquid Balance Deduction: Leader records balance reduction with mandatory cause and category
18. Excess Deduction Guard: Throws `BusinessRuleException` when deduction exceeds liquid balance
19. Flexible Chunk Composition: Mixed 10k and 5k chunk configuration in cycle creation
20. RBAC Deduction Guard: Members receive `403 Forbidden` on deduction attempt
21. RBAC Leader Deduction: Leader successfully executes deductions via API

---

## 📖 Key REST APIs

### Authentication
- `POST /api/auth/login`: Authenticate and receive JWT token + user profile.
- `GET /api/auth/me`: Get current logged-in user profile.

### Dashboard & Analytics
- `GET /api/dashboard`: Summary statistics (Group Balance, Currently Lent, Reserve Pool, Interest Earned, Active Loans, Overdue Counts).

### Monthly Cycles
- `GET /api/cycles`: List all cycles.
- `GET /api/cycles/active`: Get currently open cycle.
- `GET /api/cycles/available-balance`: Get available funds for new cycle.
- `POST /api/cycles`: *(Leader only)* Start new month with lending amount, chunk composition, and optional breakdown.
- `GET /api/cycles/{id}/eligible-members`: List members who have not yet received a chunk in that cycle.
- `POST /api/cycles/{id}/chunks`: *(Leader only)* Allocate chunks (10k, 5k, etc.) to winning auction bidders with interest bid and due dates. Enforces max 1 chunk per member per month.
- `GET /api/cycles/{id}/summary`: Month-end reconciliation summary.
- `POST /api/cycles/{id}/close`: *(Leader only)* Close cycle and calculate carried closing balance.

### Loans & Repayments
- `GET /api/loans`: Filterable list of all loans (`?status=PENDING`).
- `GET /api/loans/{id}`: Loan details.
- `POST /api/loans/{id}/payments`: *(Leader only)* Record full or partial repayment.

### Group Ledger & Reports
- `GET /api/ledger`: Complete chronological financial ledger with running balances.
- `POST /api/ledger/deduction`: *(Leader only)* Reduce group liquid balance for donation, community welfare, or expenditure with mandatory cause.
- `GET /api/reports/monthly/{cycleId}`: Comprehensive monthly report statement.
- `GET /api/reports/monthly/{cycleId}/export`: Download monthly report as CSV/Excel.
- `GET /api/audit-logs`: Audit trail of all administrative actions.

