# Smriti AI Next (स्मृति AI Next)

> **Remember what matters. Let AI handle the rest.**

Production-oriented personal AI memory assistant web & mobile application.

---

## 🌟 Overview & Product Vision

Smriti AI Next helps individuals capture, organize, remember, and act upon important dates, people, events, preferences, tasks, and commitments. 

Unlike the local-only prototype, Smriti AI Next is engineered with a **multi-user, production-first architecture**:
1. **Zero Secret Leaks**: The Google Gemini API key resides solely on the server in protected environment variables.
2. **Authentic AI Intelligence**: AI responses are never mocked or faked. When the service or quota is unavailable, explicit actionable errors are displayed.
3. **Multi-User Security with RLS**: Supabase Authentication with PostgreSQL Row Level Security (RLS) guarantees user isolation.
4. **Human-in-the-Loop Confirmation**: The AI proposes structured actions (creating memories or reminders), but nothing is written, modified, or deleted without explicit user preview and approval.
5. **Modern Stack**: React 18, Vite, TypeScript, Tailwind CSS, FullCalendar, Gemini Live API (Voice), and Capacitor Android packaging.

---

## 🏗️ Technology Stack

| Component | Technology | Rationale / Status |
|---|---|---|
| **Frontend Framework** | React 18 with Vite & Strict TypeScript | High performance, strict type safety, fast HMR |
| **Styling & Design System** | Tailwind CSS (Navy `#0B132B`, Violet `#8B5CF6`, Emerald `#10B981`) | Responsive, mobile-first, dark-accented modern theme |
| **AI Orchestration** | Google Gemini 3.8 Flash (`gemini-3.8-flash`) via `@google/genai` | Official Google GenAI SDK, fast reasoning, structured JSON output |
| **Voice Interaction** | Gemini Live API (`gemini-3.8-live`) with WebSockets & Ephemeral Tokens | Real low-latency conversational audio with interruption handling |
| **Authentication & Database** | Supabase Auth & PostgreSQL with Row Level Security (RLS) | Private user records, email/password, session recovery |
| **Calendar** | FullCalendar Community Suite | Month, week, and day views for memory dates and reminder deadlines |
| **Backend / Serverless** | Vercel Serverless Functions (`/api/*.ts`) with Vite dev runner | Seamless local development and zero-config Vercel deployment |
| **Testing** | Vitest + JSDOM + React Testing Library | Fast unit and integration tests |
| **Mobile Packaging** | Capacitor (Android Studio) | Packages the responsive web application into an installable Android APK |

---

## 🚀 Phase 1 Foundation Highlights

- ✅ **Strict TypeScript Configuration**: Solution-style tsconfig with paths `@/*` and `@api/*`.
- ✅ **Local Serverless API Execution**: Custom Vite dev server middleware runs TypeScript serverless functions dynamically via Vite SSR with zero extra background processes.
- ✅ **Health Check Endpoint (`GET /api/health`)**: Reports serverless runtime status, uptime, environment, and detects configuration presence.
- ✅ **Real Gemini Test Endpoint (`POST /api/gemini-test`)**: Genuine connectivity check to Google Gemini using `@google/genai`. Never fakes results; returns actual latency, model name, and response text.
- ✅ **Secure Environment Configuration**: `.env.example` template with strict `.gitignore` protection preventing `.env.local` or secrets from ever being tracked.
- ✅ **Automated Test Suite**: Vitest tests covering endpoints, request methods, missing-credential safety, and component rendering.

---

## ⚙️ Quick Start & Local Setup

### 1. Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to create your local `.env.local` file:
```bash
cp .env.example .env.local
```

Open `.env.local` and add your real Gemini API key:
```env
GEMINI_API_KEY=AIzaSyYourActualGeminiApiKeyHere
GEMINI_MODEL=gemini-3.8-flash
```

> **Security Note**: `.env.local` is ignored by Git and will never be committed.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Run Automated Tests
```bash
npm test
```

### 6. Run Production Build
```bash
npm run build
npm run preview
```

---

## 📡 Serverless API Reference

### 1. Health Check
- **Path**: `GET /api/health`
- **Description**: Verifies API availability, uptime, and configuration detection.
- **Example Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-10-11T19:40:00.000Z",
  "uptime": 24.1,
  "environment": "development",
  "services": {
    "geminiConfigured": true,
    "geminiModel": "gemini-3.8-flash",
    "supabaseConfigured": false
  },
  "version": "0.1.0"
}
```

### 2. Gemini Connectivity Test
- **Path**: `POST /api/gemini-test` or `GET /api/gemini-test`
- **Description**: Connects to Google Gemini API using `@google/genai` to verify live credentials and latency. Never simulates success.
- **Success (200 OK)**:
```json
{
  "ok": true,
  "model": "gemini-3.8-flash",
  "timestamp": "2026-10-11T19:40:02.000Z",
  "latencyMs": 482,
  "responsePreview": "Smriti AI connection active.",
  "verificationMessage": "Real Gemini model communication verified successfully."
}
```
- **Missing Key (503 Service Unavailable)**:
```json
{
  "error": "GEMINI_API_KEY is not configured on the server. Please set a valid key in .env.local or deployment environment.",
  "code": "MISSING_API_KEY",
  "details": "Get an API key from Google AI Studio: https://aistudio.google.com/"
}
```

---

## 🎙️ Gemini Live Voice Architecture Evaluation

In Phase 4, Smriti AI Next will implement genuine conversational voice using the **Gemini Live API**:
- **Model**: `gemini-3.8-live` (Default for low-latency voice agents and real-time dialogue).
- **Protocol**: Direct WebSocket streaming with bidirectional audio (`audio/pcm;rate=16000` 16-bit mono input; `24kHz` mono output).
- **Authentication**: Ephemeral tokens generated by a secure server-side endpoint (`/api/voice/session-token`), ensuring the client never holds the permanent API key.
- **Features Supported**:
  - Live interruption handling (server sends `interrupted: true` to halt playback instantly).
  - Push-to-talk and client-side Hybrid VAD (`audioStreamEnd`).
  - Output audio transcription streaming for accessibility and chat history logging.
  - Safe human-in-the-loop action proposals via asynchronous non-blocking function calling (`behavior: "NON_BLOCKING"`).

---

## 🗺️ Project Roadmap

- **Phase 1 (Complete)**: Project foundation, TypeScript strictness, serverless API runner, real Gemini endpoint, automated tests.
- **Phase 2 (Next)**: Supabase Auth (Sign-up, Sign-in, Recovery) & PostgreSQL schema migration with Row Level Security (RLS).
- **Phase 3**: Private Memories (CRUD & Search), Smart Reminders (Due dates, recurrence, time zones), FullCalendar integration, and AI Natural Language quick-capture.
- **Phase 4**: Grounded Memory Chat with Human-in-the-Loop Action Proposals, Gemini Live API Conversational Voice.
- **Phase 5**: Capacitor Android APK packaging, Push notifications, Settings & Data Export/Erasure.
