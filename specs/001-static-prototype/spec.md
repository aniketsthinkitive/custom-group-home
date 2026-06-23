# Feature Specification: Static Prototype (No Backend)

**Feature Branch**: `001-static-prototype`

**Created**: 2026-06-23

**Status**: Draft

**Input**: User description: "we have to remove all backend condition here and provide one admin credentials and guardian credentials so i will navigate on that portal and use functionality . we dont want any database call here store in local storage like we have to create a prototype of this website . also instead of brett in logo and everywhere show custom group home project name"

## Overview

The application UI is already built. This feature converts it into a **self-contained, no-backend prototype** that anyone can open and explore without a server, API, or database. Two ready-made demo accounts (one Administrator, one Guardian) let a reviewer sign in and walk through each portal's functionality. All data the user sees or creates is served and saved on the device (browser storage) so the experience feels real during a demo session. The product is also re-branded from "Brett" to "Custom Group Home" everywhere it is visible.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign in with a demo account and reach the right portal (Priority: P1)

A reviewer opens the prototype and is presented with a login screen. They enter one of two provided demo accounts — Administrator or Guardian. On success they land on the portal that matches that account's role, with the navigation and screens appropriate to that role. No server is contacted at any point.

**Why this priority**: Without sign-in there is no way into the portals, so this is the entry point for the entire demo. It must work fully offline.

**Independent Test**: Open the app with no server running, enter the Administrator credentials → reach the Administrator portal; sign out, enter the Guardian credentials → reach the Guardian portal. Confirm no network/API errors occur.

**Acceptance Scenarios**:

1. **Given** the prototype is opened with no backend available, **When** the reviewer enters the valid Administrator demo credentials, **Then** they are signed in and routed to the Administrator portal with admin navigation.
2. **Given** the prototype is opened with no backend available, **When** the reviewer enters the valid Guardian demo credentials, **Then** they are signed in and routed to the Guardian portal with guardian navigation.
3. **Given** a reviewer is on the login screen, **When** they enter credentials that do not match either demo account, **Then** they see a clear "invalid credentials" message and remain on the login screen.
4. **Given** a signed-in reviewer, **When** they sign out, **Then** they return to the login screen and the protected portals are no longer reachable until they sign in again.

---

### User Story 2 - Use portal functionality with no backend (Priority: P1)

After signing in, the reviewer navigates every tab/section of their portal (e.g. residents, leads, incidents, daily logs, appointments, group homes, providers, user management, settings) and performs actions — viewing lists, opening detail screens, and creating/editing/deleting records such as adding a user. Every screen shows realistic seeded data, every action appears to succeed, and nothing fails due to a missing server.

**Why this priority**: The whole point of the prototype is to demonstrate the product's functionality. Screens must render and actions must work without a backend.

**Independent Test**: Signed in as Administrator, visit each navigation item and confirm it loads with data and no errors; add a new user and confirm it appears in the list; edit and delete a record and confirm the list updates.

**Acceptance Scenarios**:

1. **Given** a signed-in reviewer, **When** they navigate to any tab/section, **Then** the screen renders populated with realistic demo data and produces no network/API errors.
2. **Given** a signed-in reviewer on a list screen, **When** they create a new record (e.g. add a user), **Then** the record is added and immediately visible in the list with a success confirmation.
3. **Given** an existing record, **When** the reviewer edits it, **Then** the change is reflected immediately in the relevant screens.
4. **Given** an existing record, **When** the reviewer deletes it, **Then** it is removed from the relevant lists.
5. **Given** any data-driven screen, **When** it loads, **Then** it never shows a backend/connection error and never hangs waiting on a server.

---

### User Story 3 - Data is saved on the device and survives refresh (Priority: P2)

Data the reviewer creates or changes is saved in the browser's local storage so the prototype behaves like a working app while they explore it.

**Why this priority**: Persistence on the device makes the demo coherent — a record added on one screen shows up on related screens, survives navigation, and survives a full page refresh, so a reviewer never loses their place mid-demo. Storage is per-browser/per-device, so each environment has its own independent copy.

**Independent Test**: Add a record, navigate away and back, then fully refresh the page (F5) and confirm it is still present; open the same link in a different browser or machine and confirm it starts from its own state (fresh seed or that environment's prior data), independent of the first.

**Acceptance Scenarios**:

1. **Given** the reviewer adds or edits a record, **When** they navigate to other screens and return, **Then** their change is still present.
2. **Given** the reviewer has made changes, **When** they fully refresh the page or close and reopen the browser tab on the same browser/device, **Then** their saved data is reloaded from local storage (not reset, and not fetched from any server).
3. **Given** a brand-new visitor with empty local storage, **When** they first open the app, **Then** the app initializes with a built-in set of realistic seed data.
4. **Given** the prototype has saved data in one browser, **When** the same link is opened in a different browser or on a different machine, **Then** that environment shows its own independent state (its own seed or prior changes), with no data shared between environments.

---

### User Story 4 - Re-brand to "Custom Group Home" (Priority: P2)

Everywhere the product currently shows the "Brett" name or branding (browser tab title, login screen, top navigation/header, logo area, and any other visible text), it instead shows "Custom Group Home".

**Why this priority**: The prototype is presented under a different product name; lingering "Brett" branding would be off-message, though it does not block functionality.

**Independent Test**: Search the running app's visible surfaces (tab title, login, header/logo) and confirm no "Brett" wording remains and "Custom Group Home" is shown.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the reviewer reads the browser tab title, **Then** it shows "Custom Group Home" and not "Brett".
2. **Given** the login screen and the top navigation/header, **When** the reviewer views the product name and logo area, **Then** "Custom Group Home" is shown and no "Brett" wording appears.
3. **Given** any visible screen, **When** the reviewer looks for the product name, **Then** "Brett" does not appear anywhere in the user-facing UI.

---

### Edge Cases

- **Invalid login**: Entering anything other than the two demo accounts shows a clear error and does not sign the user in.
- **First load / empty storage**: On first visit (no saved data), the app seeds realistic demo data automatically rather than showing empty screens or errors.
- **Refresh during a session**: A full page reload retains all saved data on the same browser/device (data is reloaded from local storage, not reset).
- **Different browser/device**: Opening the same link elsewhere shows an independent state — no data carries over between browsers or machines.
- **Storage unavailable** (e.g. private/incognito mode, storage disabled, or quota exceeded): The app still runs the demo for the current session without crashing, even if saving is limited.
- **Resetting the demo**: There must be a way to return the prototype to its original seeded state (so a reviewer can start fresh).
- **Role separation**: An Administrator-only area is not reachable while signed in as a Guardian, and vice versa.
- **Direct deep-link / protected route when signed out**: Attempting to open a protected portal screen without signing in redirects to the login screen.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The application MUST operate entirely without a backend — no live API, server, or database is contacted for application data at any time.
- **FR-002**: All existing screens, tabs, and portals (Administrator and Guardian) MUST continue to render and function using locally provided demo data instead of server responses.
- **FR-003**: The system MUST provide exactly two built-in demo accounts — one Administrator and one Guardian — and MUST allow signing in with either using a username/identifier and password.
- **FR-004**: Sign-in MUST be validated locally against the two demo accounts; valid credentials grant access, invalid credentials are rejected with a clear message. No credential check leaves the device.
- **FR-005**: On successful sign-in, the user MUST be routed to the portal matching the account's role (Administrator → admin portal; Guardian → guardian portal) with role-appropriate navigation and screens.
- **FR-006**: Role separation MUST be enforced in the prototype: a signed-in user can only reach areas permitted for their role, and protected screens are not reachable while signed out.
- **FR-007**: Users MUST be able to perform the core actions the UI exposes — view lists and details, and create, edit, and delete records (for example, add a user) — and see those changes reflected immediately across relevant screens.
- **FR-008**: Every data action (create/edit/delete) MUST appear to succeed locally with appropriate success/feedback messaging and MUST NOT surface backend/connection errors.
- **FR-009**: Data created or modified during use MUST be saved to the browser's local storage so that it **persists across page refreshes and browser restarts** on the same browser/device. Storage is inherently scoped per browser and per device: opening the same prototype in a different browser or on another machine MUST start from that environment's own independent state (its previously saved data, or fresh seed data if none). No data is shared across browsers or devices.
- **FR-010**: On first load with no saved data, the system MUST initialize with a built-in set of realistic seed data so no screen appears empty or broken.
- **FR-011**: The system MUST provide a way to reset the prototype back to its original seeded demo state.
- **FR-012**: The prototype MUST remain usable for the current session even when device storage is unavailable or full (no crash; saving may be degraded).
- **FR-013**: All user-facing "Brett" branding MUST be replaced with "Custom Group Home", including at minimum the browser tab title, the login screen, the top navigation/header product name, and the logo area.
- **FR-014**: No user-facing screen, message, or document MAY display the "Brett" name after this change.
- **FR-015**: The visual design, layout, navigation structure, and existing user flows MUST be preserved — this effort changes the data source, authentication, and branding only, not the UI design.

### Key Entities *(include if feature involves data)*

- **Demo Account**: A built-in sign-in identity. Attributes: identifier/username, password, role (Administrator or Guardian), display name. Exactly two exist.
- **Seed Dataset**: The built-in starting data that populates every portal screen on first load (e.g. residents, leads, incidents, daily logs, appointments, group homes, providers, users). Represents a realistic but fictional sample.
- **Local Data Store**: The on-device collection of all records the prototype reads and writes (created/edited/deleted during use), kept in browser storage.
- **User Record**: An example of a manageable record (relevant to the "add a user" flow) — attributes such as name, role, contact, status — used to demonstrate create/edit/delete.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The prototype can be opened and fully explored with **zero** running backend services and **zero** failed data requests across all screens.
- **SC-002**: A reviewer can sign in with either demo account and reach the correct portal in under 30 seconds, on the first attempt, 100% of the time.
- **SC-003**: 100% of navigation items in both portals load populated demo data without an error or indefinite loading state.
- **SC-004**: A reviewer can add a new user (and create/edit/delete other records) and see the change reflected immediately, every time.
- **SC-005**: Records created or changed remain consistent across navigation **and across a full page refresh** on the same browser/device 100% of the time; a different browser/device shows its own independent state.
- **SC-006**: 0 occurrences of the word "Brett" appear in any user-facing surface; the product name "Custom Group Home" is shown in the tab title, login, and header.
- **SC-007**: A reviewer can reset the prototype to its original seeded state and immediately continue using it.

## Assumptions

- **Persistence (confirmed)**: Per the user's confirmation, data is saved in browser local storage and **survives a page refresh** on the same browser/device, and is **independent per browser/per device** (no cross-environment sharing). This supersedes the earlier "data gone on refresh" statement and **requires amending Constitution Principle II** (currently ephemeral / no localStorage) to match — flagged in the Completion Report.
- **Credentials**: Two fixed demo accounts are acceptable and may be documented openly (this is a prototype, not a production system). Suggested defaults if not otherwise specified: an Administrator account and a Guardian account each with a simple email-style identifier and password, clearly labeled on or near the login screen for reviewers. Exact values to be set during planning.
- **No registration/recovery**: Account creation, password reset, email verification, and similar flows are out of scope; only the two demo logins are needed.
- **No external services**: Features that require a server (real notifications/FCM, file uploads to remote storage, live document generation services) are either stubbed locally or shown with sample data; nothing depends on a reachable server.
- **Branding scope**: "Brett" replacement covers user-facing text and the displayed product name/logo area. If the logo graphic itself contains the word "Brett," it is replaced or substituted with a "Custom Group Home" treatment; otherwise the displayed product name text is updated.
- **Single device/session demo**: The prototype is for demonstration on a single browser; multi-user sync, real security, and data sharing across devices are explicitly out of scope.
- **Existing UI is the source of truth**: The current built screens and flows are kept as-is; only data sourcing, authentication, and branding change.

## Out of Scope

- Any real backend, API, or database (including hosting one for the demo).
- Real authentication, authorization, security hardening, or secret management.
- Multi-user collaboration, cross-device synchronization, or real-time updates.
- Account self-registration, password reset/recovery, and email/SMS delivery.
- Redesigning or restructuring existing screens, layouts, or navigation.
