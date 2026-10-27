# COMMUNITYVOICE Multi-Agent Architecture

This workspace is configured with an 8-agent specialized development team. Each agent has a dedicated persona, assigned skills, and defined responsibilities.

---

## 1. The 8 Agents

| # | Agent Name | Definition File | Runtime Subagent | Core Focus |
|---|---|---|---|---|
| **1** | **Planner** | [`.agent/agents/planner.md`](.agent/agents/planner.md) | `planner` | Architecture, task breakdown, sequencing, and coordination. |
| **2** | **UI/UX Designer** | [`.agent/agents/ui-ux-designer.md`](.agent/agents/ui-ux-designer.md) | `ui-ux-designer` | Design system, token definitions, UI shaping via Impeccable. |
| **3** | **Frontend (Next.js)** | [`.agent/agents/frontend-nextjs.md`](.agent/agents/frontend-nextjs.md) | `frontend-nextjs` | React 19, Next.js (App Router), TypeScript, Tailwind CSS. |
| **4** | **Database & Backend (Supabase)** | [`.agent/agents/database-backend-supabase.md`](.agent/agents/database-backend-supabase.md) | `database-backend-supabase` | PostgreSQL schema, PostGIS geospatial, migrations, Auth, RLS. |
| **5** | **AI Service (FastAPI + OpenAI)** | [`.agent/agents/ai-service-fastapi.md`](.agent/agents/ai-service-fastapi.md) | `ai-service-fastapi` | FastAPI Python service, classification, summaries, embeddings. |
| **6** | **Map (Leaflet)** | [`.agent/agents/map-leaflet.md`](.agent/agents/map-leaflet.md) | `map-leaflet` | Interactive map view, marker clusters, GeoJSON boundaries. |
| **7** | **QA & Evaluation** | [`.agent/agents/qa-evaluation.md`](.agent/agents/qa-evaluation.md) | `qa-evaluation` | Playwright E2E browser automation, API tests, AI evaluation. |
| **8** | **Reviewer** | [`.agent/agents/reviewer.md`](.agent/agents/reviewer.md) | `reviewer` | Code review, security auditing, RLS verification, approval gate. |

---

## 2. Installed Skills (`.agent/skills/`)

- **`impeccable`** (from `pbakaus/impeccable`): High-craft design system, UI shaping, critique, and audit.
- **`webapp-testing`** (from `anthropics/skills`): Playwright automated browser interaction and testing.
- **`mcp-builder`** (from `anthropics/skills`): Building Model Context Protocol tool integrations.
- **`frontend-design`** (from `anthropics/skills`): Responsive UI design standards.
- **`web-artifacts-builder`** (from `anthropics/skills`): Interactive component isolation and building.
- **`theme-factory`** (from `anthropics/skills`): Harmonious color theme and token generation.
- **`doc-coauthoring`** (from `anthropics/skills`): Collaborative technical document authoring.
- **`skill-creator`** (from `anthropics/skills`): Workflow and SOP creation.
- **`discernment-nudge`** (from `anthropics/skills`): Critical thinking and assumption testing.

---

## 3. Workflow Lifecycle

```
[User Request]
       │
       ▼
 1. Planner  ───────► Breaks down roadmap & issues subtasks
       │
       ├────────────────────────┬────────────────────────┐
       ▼                        ▼                        ▼
 2. UI/UX Designer        4. Supabase Backend       5. AI Service (FastAPI)
  (Impeccable & Tokens)    (Schema, PostGIS, RLS)     (OpenAI & Classifiers)
       │                        │                        │
       └───────────┬────────────┴────────────────────────┘
                   │
                   ▼
       3. Frontend (Next.js)  ◄───►  6. Map (Leaflet)
        (Components & Pages)          (Interactive Map & Pins)
                   │
                   ▼
       7. QA and Evaluation
        (Playwright E2E & Edge-Case Tests)
                   │
                   ▼
       8. Reviewer
        (Security Audit, RLS Check, PR Approval)
```

---

## 4. Active Rules & Safeguards

- [`.agent/rules/anti-hallucination.md`](.agent/rules/anti-hallucination.md): Strict anti-hallucination guidelines for development agents and the runtime AI service.
