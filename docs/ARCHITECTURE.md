# Smriti AI Next — System Architecture & Implementation Blueprint

## 1. System Vision & Design Principles

Smriti AI Next is engineered as a secure, private personal memory assistant. The architecture prioritizes data ownership, explicit consent, verifiable AI actions, and zero data leakage between users or environments.

### Guiding Architectural Principles:
1. **Never Fake Intelligence**: The backend will never simulate or mock AI completions when real credentials or quotas fail. Honest status codes (401, 429, 503) and readable errors inform users of real system state.
2. **Zero-Leak Secret Isolation**: API keys (Gemini, Supabase Service Role) reside only in server runtime environments. The frontend client bundle never receives or requires root credentials.
3. **Database-Enforced Authorization**: Client queries must pass through PostgreSQL Row Level Security (RLS). User isolation is enforced by the database engine at the row level (`auth.uid() = user_id`), never trusted to client-side filtering alone.
4. **Human-in-the-Loop Safeguards**: AI can propose actions (`create_memory`, `create_reminder`, `update_memory`, `delete_memory`), but execution occurs only after explicit client preview and confirmation.
5. **Progressive Delivery**: Built in small, testable phases where each phase delivers fully operational code with automated test coverage.

---

## 2. Phase-by-Phase Roadmap

### Phase 1: Foundation, Serverless Environment & AI Pipeline (Current)
- Strict TypeScript configuration with path aliases (`@/*`, `@api/*`).
- Local Vite dev serverless middleware for dynamic execution of `/api/*.ts` routes.
- Health check endpoint (`GET /api/health`).
- Real Gemini connectivity endpoint (`POST /api/gemini-test`) using `@google/genai` (model: `gemini-3.8-flash`).
- Safe environment variables with `.env.example` and strict `.gitignore`.
- Automated testing suite with Vitest and React Testing Library.

### Phase 2: Supabase Authentication & PostgreSQL RLS
- Supabase Auth integration: Sign-up, email verification, password sign-in, password reset/recovery, and session logout.
- Database Tables:
  - `memories`: `id (uuid)`, `user_id (uuid)`, `title (text)`, `content (text)`, `category (text)`, `date (date)`, `person (text)`, `created_at`, `updated_at`.
  - `reminders`: `id (uuid)`, `user_id (uuid)`, `title (text)`, `description (text)`, `due_date (date)`, `due_time (time)`, `timezone (text)`, `recurrence (text)`, `priority (text)`, `status (text)`, `linked_memory_id (uuid)`, `completed_at`, `created_at`, `updated_at`.
  - `user_profiles`: `user_id (uuid)`, `display_name (text)`, `timezone (text)`, `created_at`, `updated_at`.
- Strict RLS Policies:
  - `ALTER TABLE memories ENABLE ROW LEVEL SECURITY;`
  - `CREATE POLICY "Users can only access their own memories" ON memories FOR ALL USING (auth.uid() = user_id);`
  - Same policy applied to `reminders` and `user_profiles`.

### Phase 3: Core Features — Memories, Reminders & FullCalendar
- Private Personal Memories: Full CRUD, category filtering, instant client search, and pagination.
- Smart Reminders: Due date, time, priority, recurrence patterns (daily, weekly, monthly, annual), memory linking.
- FullCalendar Integration: Community-edition FullCalendar with month, week, and list views displaying memory dates and upcoming reminder deadlines.
- AI Quick-Action Natural Language Capture: Floating prompt button allowing users to type or speak natural sentences ("Rahul's birthday is Nov 15") which parses and shows a preview card before writing to the database.

### Phase 4: Grounded Memory Chat & Gemini Live Voice API
- Memory Context Grounding: Server-side `/api/chat` that authenticates the user's Supabase JWT, retrieves only their saved memories and reminders directly on the server, and provides grounded context to `gemini-3.8-flash`.
- Action Proposal Cards: AI proposes structured actions (`create_memory`, `create_reminder`) requiring explicit user approval.
- Gemini Live Voice Architecture:
  - Model: `gemini-3.8-live`
  - Audio Format: 16-bit PCM mono 16kHz input; 24kHz output over WebSockets.
  - Ephemeral Session Token Endpoint: `/api/voice/session-token` to securely vend temporary tokens to the authenticated client.
  - Interruption & VAD: Native server VAD with client-side Hybrid VAD (`audioStreamEnd`) and instant playback queue flushing on interruption.

### Phase 5: Capacitor Android Packaging & PWA
- Responsive mobile layouts and PWA installability manifest.
- Capacitor configuration (`capacitor.config.ts`) and Android Studio project generation (`npx cap add android`).
- Background reminder checks and notification permissions.
- Data export (JSON backup) and complete data deletion (GDPR compliance).

---

## 3. Data Flow Diagram

```
[ Browser / Android App ]
      │
      ├── 1. Auth Flow ──────────► [ Supabase Auth ]
      │                                    │
      │                             (User JWT Token)
      │                                    ▼
      ├── 2. Data Queries ───────► [ Supabase PostgreSQL (RLS) ]
      │                             (Enforces auth.uid() = user_id)
      │
      ├── 3. AI Chat / Action ───► [ Vercel Serverless /api/chat ]
      │                                    │
      │                             (Validates JWT)
      │                             (Fetches user's memories on server)
      │                                    ▼
      │                             [ Google Gemini 3.8 Flash ]
      │                                    │
      │                             (Structured JSON reply & action)
      │                                    ▼
      ◄── 4. Action Preview ─────── [ Client Preview Card ]
      │                                    │
      └── 5. User Confirms ──────► [ Supabase Insert/Update ]
```
