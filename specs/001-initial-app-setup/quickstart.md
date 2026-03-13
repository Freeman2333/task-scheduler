# Quickstart: Personal Task Scheduler

**Date**: 2026-03-13
**Branch**: `001-initial-app-setup`

---

## Prerequisites

- Node.js 20+
- npm or pnpm
- A free [Neon](https://neon.tech) account
- A free [Vercel](https://vercel.com) account (for deployment)

---

## 1. Scaffold the Next.js Project

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"
```

---

## 2. Install Dependencies

```bash
# Database
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Calendar and drag-and-drop
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction

# shadcn/ui (init first, then add components)
npx shadcn@latest init
npx shadcn@latest add button input textarea dialog alert-dialog label
```

---

## 3. Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free project named `task-scheduler`.
2. Copy the **Connection string** from the Neon dashboard (it looks like `postgresql://user:pass@host/dbname?sslmode=require`).
3. Create `.env.local` in the project root:

```bash
DATABASE_URL=postgresql://your-user:your-password@your-host.neon.tech/neondb?sslmode=require
```

> `.env.local` is gitignored by default in Next.js. Never commit this file.

---

## 4. Configure Drizzle

Create `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 5. Create Database Schema and Run Migration

```bash
# Generate migration SQL from schema
npx drizzle-kit generate

# Apply migration to Neon database
npx drizzle-kit migrate
```

Verify the `tasks` table exists in the Neon console under **Tables**.

---

## 6. Run the App Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You should see the split-panel layout with an empty task list on the left and the calendar on the right.

---

## 7. Deploy to Vercel

```bash
# Install Vercel CLI (optional, can also use Vercel dashboard)
npm install -g vercel

# Deploy
vercel
```

**Set environment variable in Vercel**:
1. Go to your project in the [Vercel dashboard](https://vercel.com/dashboard).
2. Navigate to **Settings → Environment Variables**.
3. Add: `DATABASE_URL` = your Neon connection string.
4. Redeploy.

**Run migrations against production DB** (first deploy only):
```bash
DATABASE_URL=<your-neon-production-url> npx drizzle-kit migrate
```

---

## 8. Useful Scripts (add to package.json)

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

`db:studio` launches Drizzle Studio — a visual DB browser useful for inspecting task data locally.

---

## File Structure After Setup

```text
task-scheduler/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── actions/
│       └── tasks.ts
├── components/
│   ├── task-list/
│   │   ├── TaskList.tsx
│   │   ├── TaskItem.tsx
│   │   ├── CreateTaskForm.tsx
│   │   └── EditTaskModal.tsx
│   └── calendar/
│       └── TaskCalendar.tsx
├── db/
│   ├── index.ts
│   └── schema.ts
├── lib/
│   └── types.ts
├── drizzle/
│   └── migrations/
│       └── 0000_initial.sql
├── .env.local              ← gitignored
├── drizzle.config.ts
├── components.json
└── package.json
```
