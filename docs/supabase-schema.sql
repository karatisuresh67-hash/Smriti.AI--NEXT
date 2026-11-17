-- ==============================================================================
-- Smriti AI v3 — Supabase Schema & Row Level Security (RLS) Policies
-- Multi-user personal AI assistant schema supporting:
-- 1. Profiles & Preferences
-- 2. Memories (personal facts & knowledge)
-- 3. Reminders (scheduled alerts & recurrence)
-- 4. Tasks (task management & status tracking)
-- 5. Connected Integrations (Gmail, Calendar, LinkedIn, Instagram, X, n8n)
-- 6. Automation Executions (n8n & agent audit log)
-- 7. Activities (audit trail of user actions)
-- ==============================================================================

-- 1. Profiles Table (stores user Google OAuth metadata and preferences)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{"voiceResponse": true, "notificationsEnabled": false, "darkMode": true, "timezone": "UTC"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Memories Table (stores user's personal memories, facts, preferences, contacts)
CREATE TABLE IF NOT EXISTS public.memories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  date TEXT,
  person TEXT,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Reminders Table (stores scheduled reminders, due dates, recurrence)
CREATE TABLE IF NOT EXISTS public.reminders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  category TEXT DEFAULT 'Personal',
  priority TEXT DEFAULT 'Medium',
  status TEXT DEFAULT 'upcoming',
  linked_memory_id TEXT,
  recurrence TEXT DEFAULT 'none',
  snooze_until TIMESTAMPTZ,
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Tasks Table (stores user tasks, status, priorities, deadlines)
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT,
  due_time TEXT,
  priority TEXT DEFAULT 'Medium', -- 'Low' | 'Medium' | 'High'
  status TEXT DEFAULT 'pending',   -- 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled'
  category TEXT DEFAULT 'General',
  linked_reminder_id TEXT,
  source TEXT DEFAULT 'manual',   -- 'manual' | 'gmail' | 'chat' | 'voice' | 'n8n'
  is_demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Connected Integrations Table (stores authorization status and credentials per provider)
CREATE TABLE IF NOT EXISTS public.integrations (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'gmail' | 'google_calendar' | 'linkedin' | 'instagram' | 'x' | 'n8n' | 'slack' | 'notion'
  account_email TEXT,
  account_name TEXT,
  is_connected BOOLEAN DEFAULT FALSE,
  scopes JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, provider)
);

-- 6. Automation Executions Table (audit logs for n8n workflows and AI tool triggers)
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  trigger_source TEXT NOT NULL, -- 'chat' | 'voice' | 'webhook' | 'scheduled' | 'manual'
  status TEXT NOT NULL,         -- 'pending' | 'running' | 'success' | 'failed' | 'requires_approval'
  input_payload JSONB,
  output_payload JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  completed_at TIMESTAMPTZ
);

-- 7. Activities Table (audit trail of user actions)
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. Documents Table (stores uploaded documents, extracted knowledge, and analysis)
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'text/plain',
  extracted_text TEXT DEFAULT '',
  summary TEXT,
  key_takeaways JSONB DEFAULT '[]'::jsonb,
  suggested_tasks JSONB DEFAULT '[]'::jsonb,
  suggested_memories JSONB DEFAULT '[]'::jsonb,
  file_path TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. Browser Sessions Table (tracks persistent Browserbase / cloud browser sessions per user)
CREATE TABLE IF NOT EXISTS public.browser_sessions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  status TEXT NOT NULL DEFAULT 'idle', -- 'idle' | 'active' | 'waiting_approval' | 'terminated'
  current_url TEXT,
  last_action TEXT,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict user-level isolation: auth.uid() = user_id
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.browser_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Memories Policies
DROP POLICY IF EXISTS "Users can view own memories" ON public.memories;
CREATE POLICY "Users can view own memories" ON public.memories FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own memories" ON public.memories;
CREATE POLICY "Users can insert own memories" ON public.memories FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own memories" ON public.memories;
CREATE POLICY "Users can update own memories" ON public.memories FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own memories" ON public.memories;
CREATE POLICY "Users can delete own memories" ON public.memories FOR DELETE USING (auth.uid() = user_id);

-- Reminders Policies
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
CREATE POLICY "Users can view own reminders" ON public.reminders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reminders" ON public.reminders;
CREATE POLICY "Users can insert own reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reminders" ON public.reminders;
CREATE POLICY "Users can update own reminders" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reminders" ON public.reminders;
CREATE POLICY "Users can delete own reminders" ON public.reminders FOR DELETE USING (auth.uid() = user_id);

-- Tasks Policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON public.tasks;
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Integrations Policies
DROP POLICY IF EXISTS "Users can view own integrations" ON public.integrations;
CREATE POLICY "Users can view own integrations" ON public.integrations FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own integrations" ON public.integrations;
CREATE POLICY "Users can insert own integrations" ON public.integrations FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own integrations" ON public.integrations;
CREATE POLICY "Users can update own integrations" ON public.integrations FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own integrations" ON public.integrations;
CREATE POLICY "Users can delete own integrations" ON public.integrations FOR DELETE USING (auth.uid() = user_id);

-- Automation Executions Policies
DROP POLICY IF EXISTS "Users can view own automations" ON public.automation_executions;
CREATE POLICY "Users can view own automations" ON public.automation_executions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own automations" ON public.automation_executions;
CREATE POLICY "Users can insert own automations" ON public.automation_executions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activities Policies
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
CREATE POLICY "Users can view own activities" ON public.activities FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
CREATE POLICY "Users can insert own activities" ON public.activities FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Documents Policies
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own documents" ON public.documents;
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own documents" ON public.documents;
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

-- Browser Sessions Policies
DROP POLICY IF EXISTS "Users can view own browser sessions" ON public.browser_sessions;
CREATE POLICY "Users can view own browser sessions" ON public.browser_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own browser sessions" ON public.browser_sessions;
CREATE POLICY "Users can insert own browser sessions" ON public.browser_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own browser sessions" ON public.browser_sessions;
CREATE POLICY "Users can update own browser sessions" ON public.browser_sessions FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own browser sessions" ON public.browser_sessions;
CREATE POLICY "Users can delete own browser sessions" ON public.browser_sessions FOR DELETE USING (auth.uid() = user_id);

-- Indexes for optimal querying
CREATE INDEX IF NOT EXISTS idx_memories_user_id ON public.memories(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_integrations_user_provider ON public.integrations(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_automations_user_id ON public.automation_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);
CREATE INDEX IF NOT EXISTS idx_browser_sessions_user_id ON public.browser_sessions(user_id);
