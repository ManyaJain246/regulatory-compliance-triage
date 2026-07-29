# Regulatory Compliance Triage Application

A full-stack regulatory compliance triage application that allows compliance officers to review, filter, and manage simulated regulatory updates and their associated action items.

The application simulates real-world regulatory data that may contain missing dates, conflicting statuses, malformed text, and other data-quality issues.

---

## Live Demo

**Live Application:** https://vercel-frontend-zeta-nine.vercel.app/
**Backend Health Check:**  https://vercel-backend-ten-zeta.vercel.app/health

---

## Tech Stack

### Frontend

* React
* Vite
* TypeScript

### Backend

* Node.js
* Express.js
* Zod for request validation
* CORS

### Database

* PostgreSQL
* Prisma ORM

### Testing

* Node.js built-in test runner
* Node.js `assert`

---

# Getting Started

## Prerequisites

Make sure the following are installed:

* Node.js 18+
* npm
* PostgreSQL

---

## 1. Clone the Repository

```bash
git clone https://github.com/ManyaJain246/regulatory-compliance-triage.git
cd regulatory-compliance-triage
```

---

## 2. Install Dependencies

Install dependencies for the backend:

```bash
cd server
npm install
```

Then install dependencies for the frontend:

```bash
cd ../frontend
npm install
```

---

## 3. Configure the Database

Create a PostgreSQL database.

Create a `.env` file inside the server directory:

```env
DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/compliance_db"
PORT=4000
```

Replace `USERNAME`, `PASSWORD`, and the database name with your local PostgreSQL credentials.

---

## 4. Set Up the Database Schema

From the backend directory, run the Prisma migration:

```bash
npx prisma migrate dev
```

This creates the required database tables based on the Prisma schema.

The main entities are:

* Regulatory Authority
* Compliance Directive
* Action Item

---

## 5. Seed the Database

Run the seed script to populate PostgreSQL with mock regulatory data:

```bash
npm run seed
```

The seed data intentionally includes messy and inconsistent data such as:

* Missing effective dates
* Missing action-item due dates
* Conflicting statuses
* Malformed regulatory text
* Flagged action items
* Missing owners

This allows the application to demonstrate how regulatory data quality issues are identified and handled.
The Prisma seed script populates the PostgreSQL database with relational mock data. The current triage API uses a sanitized in-memory mock store for the interactive prototype and its REST API operations.

---

## 6. Start the Backend

From the backend directory:

```bash
npm run dev
```

The backend API will run on:

```text
http://localhost:4000
```

You can verify that the backend is running by opening:

```text
http://localhost:4000/health
```

Expected response:

```json
{
  "ok": true
}
```

---

## 7. Start the Frontend

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend
npm run dev
```

Vite will provide a local URL, typically:

```text
http://localhost:5173
```

Open this URL in your browser to access the application.

---

# Database Schema

The application uses a relational PostgreSQL database with three main entities.

```text
┌─────────────────────────────┐
│   RegulatoryAuthority       │
├─────────────────────────────┤
│ id (Primary Key)            │
│ name                        │
│ jurisdiction                │
│ contactEmail                │
└──────────────┬──────────────┘
               │
               │ 1 : Many
               ▼
┌─────────────────────────────┐
│   ComplianceDirective       │
├─────────────────────────────┤
│ id (Primary Key)            │
│ authorityId (Foreign Key)   │
│ title                       │
│ code                        │
│ summary                     │
│ effectiveDate               │
│ status                      │
│ severity                    │
│ rawText                     │
└──────────────┬──────────────┘
               │
               │ 1 : Many
               ▼
┌─────────────────────────────┐
│       ActionItem            │
├─────────────────────────────┤
│ id (Primary Key)            │
│ directiveId (Foreign Key)   │
│ title                       │
│ description                 │
│ status                      │
│ owner                       │
│ dueDate                     │
│ priority                    │
│ flagged                     │
│ flagReason                  │
└─────────────────────────────┘
```

### Relationship Explanation

**RegulatoryAuthority → ComplianceDirective**

One regulatory authority can publish multiple compliance directives.

For example:

```text
EU Market Surveillance Office
        │
        ├── EMIR Reconciliation Update
        └── KYC File Retention Revision
```

The `authorityId` foreign key connects each directive to its regulatory authority.

**ComplianceDirective → ActionItem**

One compliance directive can require multiple action items.

For example:

```text
EMIR Reconciliation Update
        │
        ├── Validate publication timestamp
        └── Archive legacy policy references
```

The `directiveId` foreign key connects each action item to its compliance directive.

This relational structure avoids duplicating authority and directive information and represents the real-world relationship between regulatory bodies, regulatory updates, and the work required to address those updates.

---

# API Endpoints

| Method | Endpoint                | Purpose                                 |
| ------ | ----------------------- | --------------------------------------- |
| GET    | `/health`               | Check if the backend is running         |
| GET    | `/api/triage`           | Fetch and filter regulatory directives  |
| POST   | `/api/triage`           | Create a new compliance directive       |
| DELETE | `/api/triage/:id`       | Delete a compliance directive           |
| PATCH  | `/api/action-items/:id` | Update an action item's status or owner |

### Filtering

The triage endpoint supports filtering by:

* Status
* Severity
* Search text

Example:

```text
GET /api/triage?status=Pending&severity=High
```

---

# Data Validation and Messy Data Handling

Incoming API requests are validated using Zod.

Invalid requests are rejected with a `400 Bad Request` response instead of being silently accepted.

The application also handles intentionally messy mock data, including:

* Missing effective dates
* Missing due dates
* Invalid or conflicting status information
* Malformed raw regulatory text
* Missing action-item owners

Flagged records contain a `flagReason` that explains why manual review may be required.

The frontend visually identifies these flagged records so that compliance officers can prioritize them.

---

# Running Tests

From the backend directory, run:

```bash
node --test
```

The tests verify important functionality such as:

* Adding a new directive
* Preserving valid action-item statuses
* Deleting a directive

---

# Application Flow

The application consists of a relational PostgreSQL database layer and a triage API layer used by the current prototype.

### Database and Seed Layer

```text
Prisma Seed Script
        │
        ▼
Prisma ORM
        │
        ▼
PostgreSQL Database
        │
        ├── Regulatory Authorities
        ├── Compliance Directives
        └── Action Items

```

# Triage Application Layer

```text
Compliance Officer
        │
        ▼
React + Vite Frontend
        │
        │ REST API
        ▼
Node.js + Express Backend
        │
        ├── Zod Validation
        ├── Data Sanitization
        └── In-Memory Mock Store


The frontend acts as the decision layer where users can review regulatory updates, filter records, identify flagged data, and update action items.
