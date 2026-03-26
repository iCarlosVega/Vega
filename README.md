<div align="center">

# ⬡ Vega

### A Multi-Agent Software Engineering Orchestration Framework

*Built on top of the Claude Code CLI — ships full-stack applications autonomously*

[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

</div>

---

## What is Vega?

Vega is an **agentic software development framework** that models the way a high-performing engineering team actually operates. A single coordinating entity — the **Orchestrator** — acts as a Principal Engineer: it holds the big picture, makes architectural decisions, and delegates every implementation detail to a roster of specialized AI subagents.

Each subagent is a headless Claude Code process running in the background, focused exclusively on its domain — backend, frontend, QA, or DevOps. They never talk to each other. All communication, handoffs, and conflict resolution flow through the Orchestrator, preventing the context collapse and race conditions that plague naive multi-agent setups.

The result: **you describe a project once, approve the plan, and Vega ships it.**

---

## Core Concepts

### The Orchestrator
Defined entirely by `CLAUDE.md`, the Orchestrator is a constrained AI persona that:
- Never writes application code directly
- Maintains the single source of truth (`state.json`)
- Mediates every inter-agent dependency via a structured action queue
- Enforces quality gates before advancing the pipeline

### Zero-Trust Agent Architecture
Every agent is isolated by design:

| Constraint | Purpose |
|---|---|
| Scoped file access | An agent can only read/write files within its declared `scope` |
| No peer communication | Agents push to a queue; the Orchestrator pulls and routes |
| Explicit yielding | Blocked agents halt and surface their blocker — no guessing |
| State-file handoffs | Only structured summaries are passed between agents, not raw context windows |

### The State Machine
All asynchronous coordination is mediated through `.claude-vega/state.json` — a file-based state machine that acts as the framework's brain.

```json
{
  "currentPhase": "building",
  "status": "healthy",
  "planApproved": true,
  "awaitingApprovalFor": null,
  "availableAgents": ["architect", "backend_dev", "frontend_dev", "qa_tester", "devops"],
  "executionPipeline": [...],
  "actionQueue": [...],
  "activeBriefs": {},
  "consultLogs": []
}
```

### The Bullpen UI
A real-time observability dashboard that streams the entire execution — no terminal overload, no guesswork.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      User Terminal                           │
│                                                             │
│   /plan "Build a task management API with React frontend"   │
│   /build  →  /consult @backend_dev  →  /approve             │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vega Orchestrator                         │
│                     (CLAUDE.md)                             │
│                                                             │
│  Reads & writes ──► .claude-vega/state.json                 │
│  Spawns ──────────► claude -p "..." > logs/[agent].log &    │
│  Mediates ────────► actionQueue  ◄──── agent pushes         │
└──────┬──────────────────────────────────────┬───────────────┘
       │ spawns                               │ spawns
       ▼                                      ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌───────────┐
│  architect  │  │ backend_dev  │  │ frontend_dev │  │ qa_tester │
│  (HITL gate)│  │              │  │              │  │           │
│             │  │  FastAPI /   │  │  Next.js /   │  │  pytest / │
│ blueprints  │  │  Node.js     │  │  React       │  │  vitest   │
└─────────────┘  └──────────────┘  └──────────────┘  └───────────┘
       │                │                 │                 │
       └────────────────┴────────────────┴─────────────────┘
                                │
                    .claude-vega/artifacts/
                    [agent]_state.md  (checklists + handoffs)
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Bullpen UI                              │
│                   (vega-ui / port 5173)                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Kanban Board  │  idle → planning → building → done  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  [architect] [backend_dev] [frontend_dev] [qa_tester] │  │
│  ├─────────────────────────┬────────────────────────────┤  │
│  │  ✅ Task Checklist       │  > spawning architect...   │  │
│  │  ☐ Define schemas        │  > writing state file...   │  │
│  │  ✅ Design API contract  │  > checklist initialized   │  │
│  │  ☐ Folder structure      │  > [x] Define schemas      │  │
│  └─────────────────────────┴────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Agent Roster

| Agent | Role | `requires_human_approval` | Default Stack |
|---|---|---|---|
| **architect** | System design, data schemas, API contracts, tech stack selection | ✅ Yes | — |
| **backend_dev** | API routes, business logic, data models, database setup | No | FastAPI + Python |
| **frontend_dev** | Pages, components, API integration, state management | No | Next.js + React + TypeScript |
| **qa_tester** | Test execution, regression audits, QA rollback triggers | No | pytest / vitest |
| **devops** | Docker Compose, Makefile, CI/CD scaffolding, `.env` management | No | GitHub Actions |

Each agent is defined by a markdown manifest with a YAML header:

```yaml
---
name: backend_dev
description: Implements all server-side code including API routes, business logic, and data models.
tools_allowed: [Bash, Read, Write, Edit, Glob, Grep]
scope: ["./backend", "./api", "./src/backend"]
requires_human_approval: false
---
```

---

## The Execution Pipeline

### 1. Plan
```
/plan "Build a weather dashboard with live alerts"
```
The Orchestrator scans the agent registry, formulates an ordered execution pipeline, writes it to `state.json`, and **halts for your approval**. Nothing runs until you say so.

### 2. Build
```
/build
```
Agents are spawned sequentially (or in parallel where safe). Each one:
1. Initializes its `<agent>_state.md` with a task checklist
2. Executes within its declared scope
3. Pushes a completion or blocker event to the action queue
4. Provides a structured handoff summary for downstream agents

The Orchestrator runs a **Standup Loop**, continuously draining the action queue to unblock agents, inject handoff context, and enforce quality gates.

### 3. Consult (Side-Channel)
```
/consult @backend_dev "The frontend is blocked — define the /api/alerts POST schema immediately"
```
Injects an urgent `activeBrief` into a running agent's context, forcing an immediate pivot. All pivots are logged with rationale in `consultLogs`.

### 4. Approve
```
/approve
```
Clears a human-in-the-loop gate (triggered when `requires_human_approval: true` agents complete) and resumes the pipeline.

---

## QA Rollback Loop

When the `qa_tester` finds a bug, it doesn't just report it — it triggers a structured rollback:

```
qa_tester pushes → { "status": "failed", "responsible_agent": "backend_dev",
                      "active_brief": "POST /api/alerts returns 500 on missing field..." }
        ↓
Orchestrator rewinds pipeline to backend_dev
        ↓
Injects failure brief into backend_dev's active context
        ↓
backend_dev re-executes with targeted fix
        ↓
qa_tester re-validates
```

---

## The Bullpen UI

A purpose-built observability dashboard that prevents terminal overload during long-running builds.

**Tech stack:** Vite · React 19 · TypeScript · Tailwind CSS 4 · WebSockets

### Features

| Component | Description |
|---|---|
| **Kanban Board** | Live pipeline visualization across 5 phases: `idle → planning → building → pending_human_review → done` |
| **Agent Tabs** | Per-agent tabs appear dynamically as agents are spawned. Status dots update in real-time |
| **Task Checklist** | Renders each agent's markdown checklist with live checkbox state and a progress bar |
| **Terminal Stream** | Streams raw headless log output for the focused agent tab, auto-scrolling to the latest line |

The UI backend is a Node.js server using:
- **`chokidar`** to watch `state.json`, agent logs, and artifact files
- **`ws`** to broadcast structured events to all connected dashboard clients over WebSocket
- **Express** to serve the initial REST state endpoint

---

## Project Structure

```
Vega/
├── CLAUDE.md                         # Orchestrator persona & operating rules
├── .claude/
│   ├── commands/
│   │   ├── plan.md                   # /plan  — pipeline formulation + approval
│   │   ├── build.md                  # /build — headless execution + standup loop
│   │   ├── consult.md                # /consult — urgent agent pivot injection
│   │   └── approve.md                # /approve — HITL gate continuation
│   └── agents/
│       ├── _template.md              # Blueprint for adding new agents
│       ├── architect.md
│       ├── backend_dev.md
│       ├── frontend_dev.md
│       ├── qa_tester.md
│       └── devops.md
├── .claude-vega/
│   ├── state.json                    # Central state machine (Orchestrator's brain)
│   ├── logs/                         # Headless agent stdout/stderr streams
│   └── artifacts/                    # Agent state files and handoff summaries
└── vega-ui/                          # Bullpen observability dashboard
    ├── server/
    │   └── index.js                  # Express + WebSocket + chokidar watcher
    └── src/
        ├── hooks/useWebSocket.ts
        └── components/
            ├── KanbanBoard.tsx
            ├── AgentTabs.tsx
            ├── TaskChecklist.tsx
            └── TerminalStream.tsx
```

---

## Getting Started

### Prerequisites
- [Claude Code CLI](https://docs.anthropic.com/claude-code) installed and authenticated
- Node.js 18+

### 1. Clone & install

```bash
git clone https://github.com/iCarlosVega/Vega.git
cd Vega/vega-ui && npm install
cd server && npm install
```

### 2. Launch the Bullpen UI

```bash
# From vega-ui/
npm start
# → WebSocket server: http://localhost:3001
# → Dashboard:        http://localhost:5173
```

### 3. Open Vega in Claude Code

```bash
# From the project root
cd /path/to/Vega
claude
```

The `CLAUDE.md` file is automatically loaded, activating the Orchestrator persona.

### 4. Run your first build

```
/plan "Build a REST API with a React dashboard for tracking personal finances"
```

Review the proposed pipeline, then:

```
/build
```

Watch the Bullpen dashboard as agents spawn, check off tasks, and hand off to each other in real-time.

---

## Extending Vega

Adding a new agent takes under 5 minutes. Copy `_template.md`, fill in the YAML manifest, and drop it in `.claude/agents/`. The Orchestrator discovers it automatically on the next `/plan` run.

```yaml
---
name: data_engineer
description: Designs and implements ETL pipelines and database migrations.
tools_allowed: [Bash, Read, Write, Edit, Glob, Grep]
scope: ["./migrations", "./etl", "./scripts"]
requires_human_approval: false
---
```

---

## Design Decisions

**Why file-based state instead of a database or message broker?**
Claude Code agents are ephemeral processes — they don't share memory. A plain JSON file is the simplest reliable IPC mechanism that every agent can read and write without additional infrastructure.

**Why does the Orchestrator never write application code?**
Mixing orchestration logic with implementation creates a context explosion. Keeping the Orchestrator's scope strictly managerial means it stays coherent over long-running builds.

**Why are agents not allowed to talk to each other?**
Peer-to-peer agent communication creates shadow state — neither you nor the Orchestrator can reason about what was agreed. Routing everything through the Orchestrator keeps the execution graph auditable and reversible.

**Why markdown checklists instead of structured task objects?**
Markdown checklists give the agent a natural chain-of-thought reasoning scaffold while remaining trivially parseable by the Bullpen UI's checklist renderer.

---

## Roadmap

- [ ] Cloud deployment integration (Vercel + Railway) via the DevOps agent
- [ ] Parallel agent execution within the same pipeline phase
- [ ] Agent memory: persistent context across sessions via vector embeddings
- [ ] Web-based pipeline editor for visual plan approval
- [ ] Plugin system for custom agent types

---

## Tech Stack Summary

| Layer | Technology |
|---|---|
| AI Runtime | Claude Code CLI (`claude -p`) |
| Orchestration | Markdown-defined slash commands + CLAUDE.md persona |
| State Management | File-based JSON state machine |
| Observability UI | React 19 + Vite 6 + Tailwind CSS 4 |
| UI Server | Node.js + Express 5 + `ws` + `chokidar` |
| Language | TypeScript (frontend) · JavaScript (server) · Markdown (agents) |

---

<div align="center">

Built by [Carlos Vega](https://github.com/iCarlosVega)

</div>
