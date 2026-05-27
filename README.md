# CodeNexus

CodeNexus is an AI-assisted programming learning platform built with Next.js. It combines a no-login trial mode, structured language/course selection, in-browser Python execution, guided lessons, a chibi assistant interface, Supabase-backed accounts/progress, and shareable learning artifacts.

## Current Status

- Frontend app: Next.js 16 App Router, React 19, Tailwind CSS 4, Framer Motion, CodeMirror, React Flow, and shadcn-style UI primitives.
- Trial mode: `/play` is available without login. Users can choose a language, choose a branch, then open a lesson. Trial progress is intentionally not saved.
- Authenticated mode: `/dashboard`, `/learn/[language]`, projects, achievements, settings, shared snippets, and mentor wall features rely on Supabase Auth and database tables.
- Course content: Python has the strongest implemented lesson flow. C, C++, Java, C#, JavaScript, and Visual Basic modules are present as learning-module structures and static-check based exercises.
- AI assistant: persona-based assistant assets and chat UI are included. Guest mode uses local fallback replies; authenticated cloud chat requires the configured API key.
- Database: Supabase SQL migrations live in `supabase/migrations`.
- Production hardening: lint/build/test scripts, error boundaries, health route, auth protection, security headers, rate-limit logic, and Python runaway-code preflight checks are included.

Note: the linked Supabase project must be active for login/register to work. If Supabase is paused or inactive, the public trial page still loads but authenticated flows will show a service-unavailable message.

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth and Postgres
- Pyodide for browser-side Python execution
- CodeMirror editor
- React Flow course maps
- Vitest unit tests

## Local Setup

Install dependencies:

```bash
npm install
```

Create your local environment file:

```bash
cp .env.local.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
DEEPSEEK_API_KEY=
```

Start the background dev server:

```bash
npm run dev:bg
```

Useful server commands:

```bash
npm run dev:status
npm run dev:logs
npm run dev:logs:follow
npm run dev:stop
```

Open:

```text
http://localhost:3000/play
```

## Verification

```bash
npm run lint
npm run build
npm run test
```

## Database Setup

Apply the SQL files in `supabase/migrations` to a Supabase project in numeric order. The app expects tables for:

- user profiles and settings
- user progress
- achievements
- shared snippets and wall shares

Keep row-level security enabled and use the included policies as the baseline.

## Repository Notes

The repository intentionally excludes:

- `.env.local` and other local secrets
- `.next/`
- `node_modules/`
- local Playwright/browser debugging artifacts
- generated QA screenshots under `output/`

Assistant character images under `public/assistant-assets` are part of the app and should be committed.
