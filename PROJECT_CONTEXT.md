# ServeLink - Project Context

This document provides a comprehensive technical overview of the current implementation of the ServeLink community platform based on actual codebase inspection.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Workspace Structure](#workspace-structure)
3. [Frontend Architecture](#frontend-architecture)
4. [Frontend Routes](#frontend-routes)
5. [Backend Architecture](#backend-architecture)
6. [Database / Prisma Schema](#database--prisma-schema)
7. [Authentication and Authorization](#authentication-and-authorization)
8. [Core Modules & Features](#core-modules--features)
9. [Important Frontend Components](#important-frontend-components)
10. [Custom Hooks](#custom-hooks)
11. [Coding Conventions](#coding-conventions)
12. [Dependencies](#dependencies)
13. [Current State / Known Issues](#current-state--known-issues)
14. [Instructions for AI Assistants](#instructions-for-ai-assistants)

---

## Project Overview
**Name:** ServeLink Community
**Purpose:** An educational and community networking platform designed for teachers, educators, and administrators to connect, share resources, discuss topics, and manage professional progress.
**Main Users:** Teachers (categorized into levels 1-5) and Admins.
**Technologies Used:**
- **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS (v4), TanStack Query, React Hook Form, Zod, Socket.io, LiveKit.
- **Backend:** NestJS (v11), TypeScript, Prisma ORM, PostgreSQL, Socket.io, Passport JWT, LiveKit Server SDK.

---

## Workspace Structure
The monorepo-style structure separates the frontend client from the backend API:

```text
c:\Users\gAMIG\Desktop\Servelink-community\
├── backend/                  # NestJS API application
│   ├── prisma/               # Prisma schema and seed scripts
│   │   └── schema.prisma     # Main database schema
│   ├── src/                  # Backend source code
│   │   ├── admin/            # Admin endpoints and logic
│   │   ├── auth/             # Authentication mechanisms
│   │   ├── chat/             # Socket gateways and messaging logic
│   │   ├── community/        # Community and networking logic
│   │   ├── discussion/       # Discussions and Q&A
│   │   ├── live-session/     # LiveKit integration
│   │   ├── post/             # Feed and resource posts
│   │   ├── profile/          # Teacher profiles
│   │   └── ...               # Additional feature modules
│   └── package.json          # Backend dependencies
└── frontend/                 # Next.js Application
    ├── src/
    │   ├── app/              # Next.js App Router (pages and layouts)
    │   ├── components/       # Reusable UI components
    │   ├── context/          # React contexts (Auth, Notification, etc.)
    │   ├── hooks/            # Custom React hooks
    │   ├── services/         # Axios-based API fetchers
    │   └── types/            # TypeScript interfaces
    └── package.json          # Frontend dependencies
```

---

## Frontend Architecture
- **Framework:** Next.js 16.2.10 (App Router).
- **Language:** TypeScript.
- **Styling:** Tailwind CSS v4, Lucide React icons, shadcn/ui patterns, and clsx/tailwind-merge.
- **State Management:** TanStack React Query (v5) for server state caching; Context API for global app state.
- **Form Handling:** React Hook Form coupled with Zod for validation.
- **HTTP Client:** Axios.
- **Real-time:** Socket.io-client.

### Important Directories
- **`src/app`**: File-system based routing. Contains pages, layouts, and route guards.
- **`src/components`**: Contains domain-specific and shared components (e.g., `/admin`, `/community`, `/chat`, `/profile`).
- **`src/hooks`**: Encapsulates React Query calls, socket connections, and business logic.
- **`src/services`**: Raw Axios API wrapper functions matching backend endpoints.
- **`src/context`**: Context providers (e.g., AuthContext manages JWT state).

---

## Frontend Routes

| Route | Page | Purpose | Access |
|-------|------|---------|--------|
| `/` | `app/page.tsx` | Redirects to `/auth/login` | Public |
| `/auth/login` | `app/auth/login/page.tsx` | User authentication | Public |
| `/auth/register` | `app/auth/register/page.tsx` | New teacher registration | Public |
| `/dashboard` | `app/dashboard/page.tsx` | Main user dashboard | Authenticated |
| `/community` | `app/community/page.tsx` | Community overview | Authenticated |
| `/community/network/discussions` | `app/community/network/discussions/page.tsx` | Discussion forums | Authenticated |
| `/community/chat/[id]` | `app/community/chat/[communityId]/page.tsx` | Real-time community chat | Authenticated |
| `/profile` | `app/profile/page.tsx` | Current user profile | Authenticated |
| `/live-sessions` | `app/live-sessions/page.tsx` | List/request live sessions | Authenticated |
| `/messages` | `app/messages/page.tsx` | Direct messages list | Authenticated |
| `/admin/*` | `app/admin/**/page.tsx` | Management dashboards (analytics, posts, users, reports) | Admin Only |

---

## Backend Architecture
- **Framework:** NestJS 11.
- **Database Access:** Prisma ORM connected to PostgreSQL.
- **API Structure:** REST API built with controllers and services, utilizing Swagger for OpenAPI documentation.
- **Real-time:** Socket.io integrated via `@nestjs/platform-socket.io` and `@nestjs/websockets`.
- **Security:** Passport-JWT strategies and custom role/permission guards.

### Major Modules
- **AuthModule:** Handles login, registration, JWT issuance.
- **AdminModule:** Extensive administrative control.
- **CommunityModule:** Manages community creation, member joins, and community types.
- **PostModule:** Handles creation, likes, and moderation of CommunityPost entities.
- **DiscussionModule:** Manages nested comments and forum logic.
- **ChatModule:** Socket gateway handling real-time messaging, read receipts, and reactions.
- **LiveSessionModule:** Interfaces with LiveKit Server SDK to provision video rooms and tokens.

---

## Database / Prisma Schema
*Database Model Overview based on `backend/prisma/schema.prisma`:*

### Core Entities
- **Teacher:** Represents a user. Contains personal/professional info, verification status (`PENDING`, `APPROVED`, `REJECTED`), suspension details, and relations to Posts, Comments, ChatMessages, and Communities.
- **Admin:** Separate entity for system administrators.
- **Community:** Represents groups (Network, School, Woreda, Zone, Region, National). Has subtypes (`COMMON`, `DEPARTMENT`).
- **CommunityPost:** Content created by teachers. Includes `postType` (`QUESTION`, `DISCUSSION`, `RESOURCE`, `ANNOUNCEMENT`), attachments, tags, and moderation status.
- **CommunityComment:** Nested replies to posts. Includes a `parentId` for threading, and `isAccepted` for Q&A best answers.
- **ChatRoom & ChatMessage:** Real-time messaging infrastructure. Supports direct (1-on-1) and community-wide rooms.
- **Discussion:** Represents standalone forum topics with rich categorization.
- **LiveSession:** Tracks video conferencing requests, statuses (`PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`), and scheduled times.
- **Notification:** Persisted system, activity, and message alerts.

### Enums
- `TeacherLevelType` (LEVEL_1 to 5)
- `PostType` (QUESTION, DISCUSSION, RESOURCE, ANNOUNCEMENT)
- `CommunityType` (NETWORK, SCHOOL, WOREDA, ZONE, REGION, NATIONAL)
- `QuestionStatus` (OPEN, CLOSED, SOLVED)

---

## Authentication and Authorization
- **Flow:** User submits credentials to API (`POST /auth/login`) -> Backend verifies bcrypt hash -> Generates JWT -> Frontend stores token and attaches to Axios headers as Bearer token.
- **Guards:** NestJS utilizes `@UseGuards(JwtAuthGuard)` to protect routes.
- **Roles:** The system distinguishes between `Teacher` and `Admin`.
- **Level Restrictions:** Teachers have levels (`LEVEL_1` through `LEVEL_5`) which restrict the types of communities they can join.

---

## Core Modules & Features

### Communities
**IMPLEMENTED:** 
Teachers join geographical or structural communities (School, Woreda, Zone, Region, National). Access is gated by `TeacherLevelType`.

### Posts & Q&A
**IMPLEMENTED:**
Teachers can create `CommunityPost` instances.
- If `postType === QUESTION`, it utilizes `QuestionStatus` (`OPEN`, `CLOSED`, `SOLVED`). The author can mark a `CommunityComment` as `isAccepted: true`.
- Supports file attachments, likes (`CommunityLike`), bookmarks (`CommunityBookmark`), and tagging.

### Real-Time Chat
**IMPLEMENTED:**
- Direct messages (1-on-1) and Community room chats.
- WebSocket events handled by `chat.gateway.ts`.
- Supports typing indicators, read receipts (single and double ticks), pinning messages, and emojis reactions.

### Live Sessions
**IMPLEMENTED:**
- Teachers can request live sessions.
- Admin approves/rejects requests.
- Integrates with LiveKit for actual video conferencing.

---

## Important Frontend Components
- **`ChatMessageBubble.tsx`** (`frontend/src/components/chat/`): Renders individual chat messages. Handles own-message vs other-message styling, edit/delete actions, reactions, and dynamic read receipt checkmarks.
- **`NotificationBanner.tsx`**: Renders toast/banner alerts. *Note: Core toasts are handled via Sonner globally in `app/layout.tsx`.*

---

## Custom Hooks
- **`useChatSocket.ts`**: Connects to Socket.io `/chat` namespace. Manages real-time state for messages, typing, read receipts, and reactions.
- **`useDirectMessages.ts` / `useDirectMessagesSocket.ts`**: Manages 1-on-1 private conversations.
- **`useAuth.ts`**: Accesses JWT auth context.
- **`usePosts.ts`, `useDiscussions.ts`, `useCommunities.ts`**: Wrappers around TanStack React Query to fetch, cache, and mutate specific backend entities.

---

## Coding Conventions
1. **Frontend State:** Exclusively utilizes React Query for async data; favors custom hooks (`useFeature`) to separate UI from data fetching logic.
2. **Backend Structure:** Modular NestJS architecture. Controllers parse DTOs, Services perform Prisma business logic.
3. **Naming:** camelCase for variables/functions, PascalCase for React components and NestJS classes. DTOs end in `Dto`.
4. **File Structure:** Features are grouped by domain (e.g., `src/chat`, `src/profile`).

---

## Dependencies
**Frontend:**
- `next` (16.2.10): React framework.
- `@tanstack/react-query`: Server state management.
- `react-hook-form` & `zod`: Type-safe form validation.
- `sonner`: Toast notifications.
- `socket.io-client`: Real-time events.
- `livekit-client` & `@livekit/components-react`: Video conferencing.
- `lucide-react`: Icons.

**Backend:**
- `@nestjs/core`, `@nestjs/common`: API framework.
- `@prisma/client`: Database ORM.
- `@nestjs/jwt`, `passport`, `bcrypt`: Authentication.
- `@nestjs/platform-socket.io`, `socket.io`: WebSockets.
- `livekit-server-sdk`: WebRTC provisioning.
- `nodemailer`: Email dispatch.

---

## Current State / Known Issues
**Working Features:**
- Complete JWT Authentication & Authorization.
- Prisma Database operations (Post, Comments, Users, Admin).
- Socket-based real-time chat with read-receipts.
- React Query integrations on frontend.
- LiveKit integration for video sessions.
- Sonner global notification system.

**Known Technical Issues:**
- *Not Found:* Advanced error boundaries in the frontend routing.
- *Not Found:* Automated E2E testing setups (Cypress/Playwright) in frontend (package.json has no test scripts).

---

# Instructions for AI Assistants Working on This Project

1. **Inspect Before Modifying:** Always use file viewing or searching tools on relevant modules before implementing changes. Rely on the actual code, not generic patterns.
2. **Reuse Existing Patterns:** Use TanStack React Query hooks in `frontend/src/hooks/` and Axios services in `frontend/src/services/` for API calls instead of building native `fetch` requests.
3. **Database Consistency:** Before querying or updating the database, cross-reference `backend/prisma/schema.prisma`. 
4. **UI Preservation:** Do not redesign or alter Tailwind classes unless explicitly requested by the user. Match existing shadcn/ui and Lucide-react usage.
5. **Real-time Changes:** Any real-time feature requires both a NestJS Gateway (`@SubscribeMessage`) adjustment and a React Socket Hook listener.
6. **Error Handling:** Backend throws standard NestJS HttpExceptions. Frontend handles them via Sonner toasts (`toast.error()`). Keep this pattern consistent.
7. **Do Not Invent Endpoints:** Always verify backend controller endpoints before consuming them in the frontend.
8. **Follow Existing ServeLink Design Patterns:** Maintain the established folder structure, naming conventions, and separation of concerns.
9. **When Uncertain, Search the Codebase First.**
