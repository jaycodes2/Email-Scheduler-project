
# Email Scheduler

A full-stack email scheduling application that allows authenticated users to compose emails, schedule them for future delivery, send to multiple recipients, control delays between emails, enforce hourly sending limits, and reliably process email jobs using BullMQ, Redis, PostgreSQL, and Nodemailer.

The application also provides Google authentication, protected routes, an email dashboard, recipient list uploads, file uploads, email status tracking, retries, persistence across worker restarts, configurable concurrency, and distributed rate limiting.

---

# Table of Contents

- [Features Implemented](#features-implemented)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Architecture Overview](#architecture-overview)
- [How Scheduling Works](#how-scheduling-works)
- [Persistence on Worker Restart](#persistence-on-worker-restart)
- [Rate Limiting and Concurrency](#rate-limiting-and-concurrency)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Redis Setup](#redis-setup)
- [Ethereal Email Setup](#ethereal-email-setup)
- [How to Run the Backend](#how-to-run-the-backend)
- [How to Run the BullMQ Worker](#how-to-run-the-bullmq-worker)
- [How to Run the Frontend](#how-to-run-the-frontend)
- [Authentication](#authentication)
- [API Overview](#api-overview)
- [Testing](#testing)

---

# Features Implemented

## Backend Features

The backend implements:

- Email scheduling for a future date and time
- Multiple recipients
- Configurable delay between emails
- Configurable hourly email limit
- PostgreSQL persistence
- Redis-backed BullMQ queue
- Delayed BullMQ jobs
- Email processing worker
- Worker restart persistence
- Retry handling for failed jobs
- Exponential retry backoff
- Failed email status tracking
- Sent email status tracking
- Configurable worker concurrency
- Configurable hourly rate limiting
- Shared rate limiting across multiple workers
- Google OAuth authentication
- Current authenticated user endpoint
- Logout endpoint
- Recipient list file upload
- Email file upload
- Star/unstar email functionality

---

## Frontend Features

The frontend implements:

- Google login page

![Login](./screenshots/login.png)

- Dashboard

![Dashboard](./screenshots/dashboard.png)

- Compose email page
![Compose](./screenshots/compose.png)

- Protected routes
- Persistent authentication state

- Scheduled email view
- Sent email view
- Email status display
- Multiple recipients
- Delay configuration
- Hourly limit configuration
- Recipient list upload
- File upload
- Star/unstar functionality
- Loading states
- Empty states
- Logout functionality

---

# Tech Stack

## Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS

## Backend

- Node.js
- Express
- TypeScript

## Database

- PostgreSQL

## Queue and Background Processing

- Redis
- BullMQ

## Email

- Nodemailer
- Ethereal Email

## Authentication

- Google OAuth
- Passport.js

---

# Project Architecture

```text
                           ┌─────────────────────┐
                           │      Frontend       │
                           │   React + Vite      │
                           └──────────┬──────────┘
                                      │
                                      │ HTTP Requests
                                      │
                           ┌──────────▼──────────┐
                           │    Express API      │
                           │                     │
                           │ Authentication      │
                           │ Email Scheduling    │
                           │ File Upload         │
                           └───────┬───────┬─────┘
                                   │       │
                                   │       │
                    ┌──────────────▼─┐   ┌─▼──────────────┐
                    │   PostgreSQL   │   │     Redis      │
                    │                │   │                │
                    │ Email Records  │   │ BullMQ Queue   │
                    │ Status         │   │ Delayed Jobs   │
                    └────────────────┘   └───────┬────────┘
                                                 │
                                                 │
                                      ┌──────────▼──────────┐
                                      │    Email Worker     │
                                      │      BullMQ         │
                                      │                     │
                                      │ Concurrency         │
                                      │ Rate Limiting       │
                                      │ Retries             │
                                      └──────────┬──────────┘
                                                 │
                                                 │
                                      ┌──────────▼──────────┐
                                      │     Nodemailer      │
                                      │   Ethereal Email    │
                                      └─────────────────────┘
````

---

# Architecture Overview

The application separates the frontend, API, database, queue, and worker responsibilities.

## Frontend

The React frontend provides:

* Login
* Dashboard
* Compose page
* Scheduled email view
* Sent email view

The frontend communicates with the Express backend using HTTP requests.

---

## Express Backend

The Express backend is responsible for:

* Handling authentication
* Creating scheduled email records
* Validating requests
* Uploading files
* Creating BullMQ jobs
* Fetching emails from PostgreSQL
* Updating starred emails
* Providing authentication information

When an email is scheduled, the backend performs two important operations:

1. Stores the email information in PostgreSQL.
2. Creates a delayed BullMQ job in Redis.

---

## PostgreSQL

PostgreSQL stores the persistent email information.

The `scheduled_emails` table stores data such as:

* Email ID
* Recipient
* Subject
* Body
* Scheduled time
* Status
* Creation time
* Update time
* Starred state

Example statuses include:

```text
scheduled
sent
failed
```

PostgreSQL acts as the persistent source of email information.

---

## Redis and BullMQ

Redis is used by BullMQ to manage the email queue.

BullMQ handles:

* Delayed jobs
* Job processing
* Retry attempts
* Backoff
* Worker coordination
* Rate limiting

A scheduled email is converted into a BullMQ job.

The job remains in the queue until its scheduled processing time is reached.

---

## Email Worker

The worker runs separately from the Express API.

Its responsibilities are:

1. Receive a job from the `email-queue`.
2. Retrieve the email record from PostgreSQL.
3. Create the mail transporter.
4. Send the email using Nodemailer.
5. Update the email status to `sent`.
6. Retry failed jobs when configured.
7. Mark permanently failed jobs as `failed`.

---

# How Scheduling Works

When a user creates an email schedule, they can provide:

* One or more recipients
* Subject
* Email body
* Scheduled date and time
* Delay between emails
* Hourly limit

The backend creates an individual email record and queue job for each recipient.

---

## Basic Scheduling

Suppose the user selects:

```text
Scheduled Time: 10:00:00
Recipients: 3
Delay Between Emails: 5 seconds
```

The resulting schedule is:

```text
Recipient 1 → 10:00:00
Recipient 2 → 10:00:05
Recipient 3 → 10:00:10
```

The scheduling logic calculates the send time for every recipient.

Conceptually:

```text
emailScheduledTime =
baseScheduledTime + recipientIndex × delay
```

---

## No Delay

If the delay is set to:

```text
0 seconds
```

all emails become eligible for processing at the same scheduled time.

Actual processing is then controlled by:

* Worker concurrency
* BullMQ rate limiting

---

## Hourly Limit Scheduling

The application also supports an hourly limit.

For example:

```text
Recipients: 12
Hourly Limit: 5
```

The recipients are divided into hourly batches.

```text
Hour 1
Recipient 1
Recipient 2
Recipient 3
Recipient 4
Recipient 5

Hour 2
Recipient 6
Recipient 7
Recipient 8
Recipient 9
Recipient 10

Hour 3
Recipient 11
Recipient 12
```

Each new batch is scheduled one hour after the previous batch.

Within a batch, the configured delay between emails is still applied.

Example:

```text
Base Time: 10:00
Hourly Limit: 3
Delay: 10 seconds
Recipients: 6
```

The result is:

```text
Email 1 → 10:00:00
Email 2 → 10:00:10
Email 3 → 10:00:20

Email 4 → 11:00:00
Email 5 → 11:00:10
Email 6 → 11:00:20
```

---

# Persistence on Worker Restart

Email information is stored in PostgreSQL and jobs are managed by BullMQ using Redis.

The Express API and the worker are separate processes.

This means that scheduling an email does not depend on the worker remaining continuously active.

The flow is:

```text
User schedules email
        ↓
Email stored in PostgreSQL
        ↓
Delayed BullMQ job stored in Redis
        ↓
Worker can be stopped
        ↓
Worker is restarted
        ↓
BullMQ continues processing available jobs
```

Because the job is stored outside the worker process, stopping and restarting the worker does not require recreating the scheduled email manually.

This behavior was tested by:

1. Scheduling an email.
2. Stopping the worker.
3. Starting the worker again.
4. Verifying that the scheduled job was still processed.

---

# Rate Limiting and Concurrency

Rate limiting and concurrency are controlled through environment variables.

```env
MAX_EMAILS_PER_HOUR=5
WORKER_CONCURRENCY=2
```

---

## Worker Concurrency

`WORKER_CONCURRENCY` controls how many jobs a single worker can process simultaneously.

Example:

```env
WORKER_CONCURRENCY=2
```

This allows the worker to process up to two jobs concurrently.

The worker configuration uses:

```text
concurrency = WORKER_CONCURRENCY
```

Concurrency controls parallel job processing.

It does not replace rate limiting.

---

## Hourly Rate Limiting

`MAX_EMAILS_PER_HOUR` controls the maximum number of jobs processed during a one-hour window.

Example:

```env
MAX_EMAILS_PER_HOUR=5
```

The BullMQ worker limiter is configured conceptually as:

```text
Maximum jobs: MAX_EMAILS_PER_HOUR
Duration: 60 × 60 × 1000 milliseconds
```

This prevents the configured throughput from being exceeded.

---

## Multiple Worker Safety

The rate limiting configuration is Redis-backed through BullMQ.

Because Redis is shared, multiple workers connected to:

```text
Same Redis instance
Same BullMQ queue
```

share the rate limiting state.

Example:

```text
Worker A
    │
    ├── Redis / BullMQ Queue
    │
Worker B
```

Both workers consume jobs from the same queue.

The configured limiter is therefore enforced through the shared queue infrastructure rather than using an in-memory counter inside one worker process.

This was tested by starting multiple worker processes and processing jobs from the same queue.

---

# Retry Handling

Each email job is configured with multiple attempts.

Conceptually:

```text
Attempts: 3
Backoff: Exponential
Initial Delay: 1000ms
```

If sending an email fails:

```text
Attempt 1 fails
      ↓
Wait according to backoff
      ↓
Attempt 2
      ↓
Wait according to backoff
      ↓
Attempt 3
```

If the job eventually succeeds:

```text
status = sent
```

If all configured attempts are exhausted:

```text
status = failed
```

The worker updates the corresponding PostgreSQL record after the final failure.

---

# Prerequisites

Before running the application, install:

* Node.js
* npm
* PostgreSQL
* Redis

You also need:

* A Google OAuth application
* Ethereal Email configuration

---

# Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
PORT=5000

DATABASE_URL=your_postgresql_connection_string

REDIS_URL=your_redis_connection_string

MAX_EMAILS_PER_HOUR=5
WORKER_CONCURRENCY=2

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
```

Depending on the mailer configuration, Ethereal SMTP credentials may also be configured.

Example:

```env
ETHEREAL_USER=your_ethereal_username
ETHEREAL_PASS=your_ethereal_password
```

Do not commit the `.env` file to Git.

---

# Database Setup

Install and start PostgreSQL.

Create a database for the project.

Example:

```sql
CREATE DATABASE email_scheduler;
```

Configure the database connection using your project's environment configuration.

Example:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/email_scheduler
```

Create the required table for scheduled emails.

The application stores email records with fields such as:

```text
id
recipient
subject
body
scheduled_at
status
created_at
updated_at
starred
```

After configuring the database connection, start the backend and verify the connection.

The application logs the database connection status when the server starts.

---

# Redis Setup

BullMQ requires Redis.

## Option 1: Local Redis

Install Redis and start the Redis server.

Verify Redis is running.

The backend performs a Redis ping when starting.

A successful connection should return:

```text
PONG
```

Configure Redis in the backend environment:

```env
REDIS_URL=redis://localhost:6379
```

---

## Option 2: Existing Redis Instance

If using an external Redis instance, provide its connection URL in the appropriate environment variable.

Example:

```env
REDIS_URL=your_redis_connection_url
```

The API and all BullMQ workers must connect to the same Redis instance for shared queue state and distributed rate limiting.

---

# Ethereal Email Setup

This project uses **Nodemailer with Ethereal Email** for testing email delivery.

The application does not require manually creating or configuring an Ethereal account in the `.env` file.

Instead, the mailer creates a temporary Ethereal test account dynamically using Nodemailer's:

```ts
nodemailer.createTestAccount()
```

The current mailer implementation works as follows:

```ts
import nodemailer from "nodemailer";

export async function createMailer() {
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
}
```

## How Email Testing Works

When the BullMQ worker processes an email job, it performs the following flow:

```text
BullMQ Worker receives job
        ↓
Email record is fetched from PostgreSQL
        ↓
createMailer() is called
        ↓
Nodemailer creates an Ethereal test account
        ↓
SMTP transporter is configured using the generated credentials
        ↓
Email is sent through Ethereal
        ↓
Nodemailer returns a message ID
        ↓
A preview URL is generated
```

The worker logs the result after successfully sending an email:

```text
Email sent: <message-id>
Preview URL: <ethereal-preview-url>
```

The preview URL is generated using:

```ts
nodemailer.getTestMessageUrl(info)
```

Opening this URL in a browser allows the sent test email to be viewed.

## Important Note

The current implementation creates an Ethereal test account dynamically whenever `createMailer()` is called.

Therefore, the project currently does **not** require the following environment variables:

```env
ETHEREAL_HOST=
ETHEREAL_PORT=
ETHEREAL_USER=
ETHEREAL_PASS=
```

The only setup required for email testing is installing Nodemailer as a backend dependency:

```bash
npm install nodemailer
```

Nodemailer automatically handles the creation of the Ethereal test account through:

```ts
const testAccount = await nodemailer.createTestAccount();
```

This setup is intended for development and testing. Emails are sent to Ethereal's testing environment and can be inspected using the generated preview URL rather than being delivered to real recipient inboxes.

# How to Run the Backend

Open a terminal.

Navigate to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Make sure:

* PostgreSQL is running.
* Redis is running.
* The `.env` file is configured.

Start the Express backend:

```bash
npm run dev
```

If your project uses a different backend script, use the script defined in your `backend/package.json`.

The backend runs on:

```text
http://localhost:5000
```

The application verifies connections to:

```text
PostgreSQL
Redis
```

A health endpoint is also available:

```http
GET /health
```

Example response:

```json
{
  "status": "ok"
}
```

---

# How to Run the BullMQ Worker

The worker must run separately from the Express backend.

Open another terminal.

Navigate to:

```bash
cd backend
```

Start the worker:

```bash
npx tsx src/workers/emailWorker.ts
```

The worker should log messages similar to:

```text
Email worker started
Worker is ready
```

When a scheduled job becomes available:

```text
Processing job: ...
```

After successful delivery:

```text
Email sent: ...
Preview URL: ...
Job completed: ...
```

The worker is responsible for:

* Processing scheduled jobs
* Sending emails
* Applying concurrency
* Applying rate limiting
* Retrying failed jobs
* Updating email status

---

# How to Run the Frontend

Open another terminal.

Navigate to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

Open the displayed URL in the browser.

---

# Running the Complete Application

The application requires three main components to run.

## Terminal 1 — Backend

```bash
cd backend
npm run dev
```

## Terminal 2 — Email Worker

```bash
cd backend
npx tsx src/workers/emailWorker.ts
```

## Terminal 3 — Frontend

```bash
cd frontend
npm run dev
```

Also ensure:

```text
PostgreSQL is running
Redis is running
```

---

# Authentication

The application uses Google OAuth authentication.

The login flow is:

```text
User
  ↓
Login Page
  ↓
Google OAuth
  ↓
Backend OAuth Callback
  ↓
Authenticated Session
  ↓
Frontend Authentication Context
  ↓
Dashboard
```

After successful authentication, the user is redirected to:

```text
/dashboard
```

---

## Current User

The frontend checks authentication using:

```http
GET /auth/me
```

The request includes credentials:

```text
credentials: include
```

The authenticated user is stored in the frontend authentication context.

---

## Protected Routes

Dashboard and compose pages are protected.

If no authenticated user exists:

```text
/dashboard
     ↓
Redirect to
     ↓
/login
```

The protected route prevents unauthenticated users from accessing protected pages.

---

## Logout

Logout is handled through:

```http
POST /auth/logout
```

After logout:

* The backend session is cleared.
* The frontend user state is cleared.
* Protected pages redirect the user to the login page.

---

# Email API Overview

## Create Scheduled Emails

```http
POST /emails
```

The request includes information such as:

```text
recipients
subject
body
scheduledAt
delayBetween
hourlyLimit
```

For every recipient:

1. A PostgreSQL email record is created.
2. An individual BullMQ job is created.
3. The job is delayed until its calculated scheduled time.

---

## Get Emails

```http
GET /emails
```

Emails are returned ordered by scheduled time.

Filtering by status is also supported.

Example:

```http
GET /emails?status=scheduled
```

or:

```http
GET /emails?status=sent
```

---

## Star or Unstar Email

```http
PATCH /emails/:id/star
```

This toggles the `starred` state of an email.

---

# File Upload Features

The compose interface supports file-related functionality.

Implemented features include:

* Recipient list upload
* File upload during email composition

Recipient lists can be uploaded to populate multiple email recipients.

Supported recipient list formats include:

```text
.txt
.csv
```

The uploaded recipient information is processed and added to the recipient list.

---

# Email Status Flow

The typical lifecycle of an email is:

```text
User schedules email
        ↓
scheduled
        ↓
BullMQ processes job
        ↓
Email sent successfully
        ↓
sent
```

If all retry attempts fail:

```text
scheduled
        ↓
Processing fails
        ↓
Retry
        ↓
Retry
        ↓
Final failure
        ↓
failed
```

---

# Dashboard

The dashboard provides access to scheduled and processed emails.

Implemented functionality includes:

* Scheduled emails
* Sent emails
* Email status display
* Starred emails
* Search and filtering
* Loading states
* Empty states

---

# Testing Performed

The application was tested for the following functionality.

## Scheduling

* Schedule a single email.
* Schedule multiple emails.
* Schedule emails for a future time.
* Configure delays between recipients.
* Verify emails are processed in the expected schedule.

---

## Rate Limiting

Rate limiting was tested by:

1. Setting a small `MAX_EMAILS_PER_HOUR`.
2. Scheduling more emails than the configured limit.
3. Verifying that only the allowed number were processed during the rate-limit window.
4. Leaving remaining jobs in the queue instead of permanently failing or dropping them.

---

## Multiple Workers

Shared rate limiting was tested by:

1. Starting multiple worker processes.
2. Connecting both workers to the same Redis instance.
3. Processing jobs from the same BullMQ queue.
4. Verifying that workers coordinated through the shared queue infrastructure.

---

## Persistence on Restart

Persistence was tested by:

1. Scheduling an email.
2. Stopping the worker.
3. Restarting the worker.
4. Verifying that the previously scheduled job was still available and processed.

---

## Retry Handling

Retry behavior was implemented using:

```text
3 attempts
Exponential backoff
```

After the final failed attempt, the email status is updated to:

```text
failed
```

---

## Authentication

Authentication testing included:

* Google login
* Redirect to dashboard after login
* `/auth/me`
* Protected routes
* Logout
* Redirect to login after logout

---

# Configuration Summary

The important backend configuration values are:

```env
PORT=5000

DATABASE_URL=...

REDIS_URL=...

MAX_EMAILS_PER_HOUR=5
WORKER_CONCURRENCY=2

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=...

ETHEREAL_USER=...
ETHEREAL_PASS=...
```

These values should be adjusted for the local environment.

---

# Summary

This project implements a complete email scheduling workflow with:

```text
React Frontend
        ↓
Express Backend
        ↓
PostgreSQL Persistence
        ↓
BullMQ + Redis Queue
        ↓
Background Worker
        ↓
Nodemailer + Ethereal Email
```

The system supports reliable scheduling, persistence across worker restarts, configurable concurrency, Redis-backed rate limiting, retry handling, authentication, protected routes, and a frontend dashboard for managing scheduled and processed emails.