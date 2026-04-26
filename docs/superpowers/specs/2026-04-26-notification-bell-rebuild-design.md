# Notification Bell Rebuild Design

Date: 2026-04-26

## Context

The app already has a notification bell UI, `useNotifications` hook, `/api/notifications` routes, a `/notifications` page, and a development test route. The current system is incomplete:

- The repository does not include a migration that creates the `notifications` table.
- Report create/update routes do not create real notifications.
- Notification creation logic is not centralized.
- `/notifications` depends on hook state but does not reliably fetch a list on page load.
- Realtime code exists, but the app uses NextAuth while the browser Supabase client has no guaranteed Supabase auth session. Polling must be the reliable baseline.

## Goal

Rebuild the alert bell so authenticated users reliably receive, view, and manage notifications for ADR report activity.

## Recipient Rule

For this phase, every user record in the `users` table receives each ADR report notification.

This applies to:

- New ADR report created through authenticated report submission.
- New ADR report created through public submission.
- Existing ADR report updated.

Notification delivery failures must not block report creation or update. The report operation should succeed, and notification failures should be logged server-side.

## Data Model

Add a Supabase migration for a `notifications` table:

- `id uuid primary key default gen_random_uuid()`
- `recipient_id uuid not null references users(id) on delete cascade`
- `sender_id uuid null references users(id) on delete set null`
- `type text not null`
- `title text not null`
- `message text not null`
- `data jsonb null`
- `read boolean not null default false`
- `created_at timestamptz not null default timezone('utc', now())`
- `updated_at timestamptz not null default timezone('utc', now())`

Indexes:

- `(recipient_id, read, created_at desc)` for unread counts and bell dropdown.
- `(recipient_id, created_at desc)` for notification list pagination.

RLS should be enabled. Users can select and update only their own notifications. Server-side creation uses the service-role admin client.

## Notification Service

Create `lib/notification-service.ts` as the single server-side creation layer.

Responsibilities:

- Fetch all notification recipients from `users`.
- Deduplicate recipient IDs.
- Insert notifications in bulk.
- Build ADR-specific payloads consistently.
- Catch and log failures when called in non-blocking mode.

Public API shape:

- `createNotificationForUsers(input)` for generic notifications.
- `notifyAllUsersAboutNewReport(report, senderId?)`.
- `notifyAllUsersAboutReportUpdate(report, senderId?)`.

ADR notification payload should include:

- `report_id`
- `report_code`
- `patient_name`
- `organization`
- `severity_level`
- `event`

## API Routes

Keep `/api/notifications` as the client contract:

- `GET /api/notifications?page=1&limit=20&unread_only=false`
  - Returns notifications, pagination, and stats for the current session user.
- `PUT /api/notifications`
  - `mark_as_read` with `notification_ids`.
  - `mark_all_as_read`.

Keep `/api/notifications/stats` for lightweight badge refresh.

Implementation details:

- Use `getServerSession(authOptions)` for authorization.
- Use a server/admin Supabase client where RLS or cookie auth is unreliable.
- Always scope reads and updates by `recipient_id = session.user.id`.
- Return clear errors for unauthorized and invalid payloads.

## Report Integration

Authenticated create route:

- After report and related drug rows are successfully created, call `notifyAllUsersAboutNewReport(reportData, session.user.id)`.
- Notification errors are caught and logged.

Public create route:

- After report and related drug rows are successfully created, call `notifyAllUsersAboutNewReport(reportData, null)`.
- Notification errors are caught and logged.

Authenticated update route:

- After report and related drug rows are successfully updated, call `notifyAllUsersAboutReportUpdate(reportData, session.user.id)`.
- Notification errors are caught and logged.

## Hook Behavior

Update `useNotifications` so it is the single client state manager:

- Fetch stats when a user session becomes available.
- Fetch notifications on demand when the bell opens.
- Fetch notifications automatically when the full `/notifications` page mounts.
- Poll stats every 30 seconds as the reliable baseline.
- Optionally keep Supabase realtime as best-effort, but do not depend on it for correctness.
- Avoid stale closures when merging inserted/updated notifications.
- Reconcile stats after mark-read actions by refetching stats or carefully updating local state.

## UI Behavior

Notification bell:

- Shows only for authenticated users.
- Badge displays unread count, capped at `99+`.
- Dropdown fetches the latest notifications when opened.
- Supports marking one notification as read.
- Supports marking all notifications as read.
- Links report notifications to `/reports/[id]`.
- Shows loading, empty, and error-safe states.

Full notifications page:

- Fetches notifications on mount.
- Supports all/unread filter.
- Supports selected mark-as-read and mark-all-as-read.
- Supports loading more notifications.

Vietnamese labels should be corrected in files touched by this change where text is currently mojibake.

## Testing

Minimum verification:

- TypeScript/build check.
- Manual/API test creating a development notification for the current user.
- Create an authenticated ADR report and confirm all users receive unread notifications.
- Create a public ADR report and confirm all users receive unread notifications.
- Update an ADR report and confirm all users receive update notifications.
- Mark one notification read and confirm the badge count changes.
- Mark all notifications read and confirm the badge count reaches zero.

## Out Of Scope

- Per-organization notification routing.
- User notification preferences.
- Email, Telegram, browser push, or sound alerts.
- Guaranteed realtime delivery through Supabase auth changes.
