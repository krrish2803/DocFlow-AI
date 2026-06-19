# DocFlow AI

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8)

An AI-powered documentation platform that automatically generates, updates, and serves technical documentation from code, APIs, PRs, and support conversations.

---

## The Problem

Technical documentation is:
- **Outdated** — Docs drift from code as features ship
- **Manual** — Engineers spend hours writing and maintaining docs
- **Disconnected** — Docs live in silos, disconnected from codebases
- **Inconsistent** — Different teams write docs in different formats

## The Solution

DocFlow AI solves this by:
- **Syncing** with your GitHub repos and OpenAPI specs automatically
- **Generating** documentation using NVIDIA AI (Llama 3.1) with source citations
- **Tracking staleness** via SHA-256 content hashing when sources change
- **Reviewing** with section-level approve/reject workflows and audit trails
- **Hosting** a documentation portal with custom domain support

---

## Features

| Feature | Description |
|---------|-------------|
| **Source Sync** | Connect GitHub repos and OpenAPI specs. Auto-sync on demand. |
| **AI Generation** | Generate READMEs, API refs, changelogs, guides with NVIDIA AI |
| **Staleness Detection** | SHA-256 hashing detects when source files change |
| **Review Workflow** | Section-level approve/reject with reviewer assignment |
| **Review Agent** | AI-powered code review with per-file scoring |
| **Code Assistant** | Chat-based code analysis and bug detection |
| **RAG Assistant** | Ask questions about your docs, get cited answers |
| **Command Palette** | `⌘K` navigation with live document search |
| **Dark/Light Themes** | System-aware theme switching |
| **Keyboard Shortcuts** | `n` new doc, `/` search, `r` regenerate |
| **Audit Trail** | Full history of all actions in your workspace |
| **Custom Domains** | Host docs on your own domain with SSL |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Local Development

```bash
# Clone the repository
git clone https://github.com/krrish2803/DocFlow-AI.git
cd DocFlow-AI

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npm run db:setup

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### First Time Setup

1. **Sign up** — Create a new account with email/password
2. **Add Sources** — Connect a GitHub repo or OpenAPI spec
3. **Sync** — Pull in source files
4. **Generate** — Create documentation from your sources
5. **Review** — Approve or reject sections
6. **Publish** — Host your docs on a custom domain

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS 4 |
| **Database** | SQLite (local) / Turso (production) |
| **ORM** | Prisma 6 |
| **Auth** | JWT (jose) + bcrypt |
| **AI** | NVIDIA API (Llama 3.1 8B) |
| **Animation** | Framer Motion |
| **Icons** | Lucide React |
| **State** | Zustand |

---

## Project Structure

```
DocFlow-AI/
├── prisma/
│   └── schema.prisma              # Database schema (17 models)
├── src/
│   ├── app/
│   │   ├── api/                   # 30+ API routes
│   │   │   ├── auth/              # Signin, signup, signout, me
│   │   │   ├── sources/           # CRUD + sync + drift detection
│   │   │   ├── documents/         # CRUD + versions + citations + stale
│   │   │   ├── reviews/           # CRUD + assignment + audit
│   │   │   ├── agents/            # Review agent + code assistant
│   │   │   ├── assistant/         # RAG chat
│   │   │   ├── dashboard/         # Metrics + activity
│   │   │   ├── conversations/     # Chat history
│   │   │   ├── search/            # Full-text search
│   │   │   ├── settings/          # Workspace config
│   │   │   └── workspace/         # Members + API keys
│   │   ├── app/                   # Dashboard pages
│   │   │   ├── dashboard/         # Metrics + activity feed
│   │   │   ├── sources/           # Source management
│   │   │   ├── documents/         # Document list + detail
│   │   │   ├── generate/          # AI generation workflows
│   │   │   ├── reviews/           # Review queue
│   │   │   ├── review-agent/      # AI code review
│   │   │   ├── code-assistant/    # Code analysis chat
│   │   │   ├── assistant/         # RAG documentation chat
│   │   │   ├── portal/            # Hosting + domains
│   │   │   └── settings/          # Workspace settings
│   │   ├── signin/                # Auth pages
│   │   └── signup/
│   ├── components/
│   │   ├── app/                   # App shell (sidebar, topbar, etc.)
│   │   └── ui/                    # Reusable UI primitives
│   ├── lib/
│   │   ├── prisma.ts              # Prisma client (Turso adapter)
│   │   ├── nvidia.ts              # NVIDIA AI integration
│   │   ├── auth-server.ts         # JWT + bcrypt
│   │   ├── generator.ts           # Doc generation pipeline
│   │   ├── github.ts              # GitHub API client
│   │   └── validation.ts          # Input validation
│   ├── hooks/                     # Custom React hooks
│   ├── types/                     # TypeScript types
│   └── proxy.ts                   # Route protection middleware
├── netlify.toml                   # Netlify configuration
├── package.json
└── tsconfig.json
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path (`file:./dev.db`) or PostgreSQL URL |
| `TURSO_DATABASE_URL` | No | Turso database URL for production |
| `TURSO_AUTH_TOKEN` | No | Turso authentication token |
| `NVIDIA_API_KEY` | No | NVIDIA API key for AI features (set via UI) |
| `GITHUB_TOKEN` | No | GitHub token for higher API rate limits |

---

## Deployment

### Netlify + Turso (Recommended)

#### 1. Create Turso Database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create docflow-ai

# Get connection URL
turso db show docflow-ai --url

# Create auth token
turso db tokens create docflow-ai
```

#### 2. Deploy to Netlify

1. Push code to GitHub
2. Connect repo to Netlify
3. Set environment variables:
   - `TURSO_DATABASE_URL` — from step 1
   - `TURSO_AUTH_TOKEN` — from step 1
4. Deploy

#### 3. Apply Database Schema

```bash
# Generate migration
npx prisma migrate dev --name init

# Apply to Turso
turso db shell docflow-ai < ./prisma/migrations/*/migration.sql
```

### Vercel (Alternative)

1. Push code to GitHub
2. Import repo in Vercel
3. Set `DATABASE_URL` to SQLite path
4. Deploy

> **Note:** SQLite on Vercel uses `/tmp` for temporary storage. Data resets on each deployment. Use Turso for persistent data.

---

## API Routes

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/signin` | Sign in |
| POST | `/api/auth/signout` | Sign out |
| GET | `/api/auth/me` | Get current user |

### Sources
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sources` | List sources |
| POST | `/api/sources` | Create source |
| DELETE | `/api/sources/[id]` | Delete source |
| POST | `/api/sources/[id]/sync` | Sync source files |
| GET | `/api/sources/[id]/drift` | Detect endpoint drift |
| GET | `/api/sources/[id]/undocumented` | Find undocumented routes |

### Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List documents |
| POST | `/api/documents` | Create document |
| GET | `/api/documents/[id]` | Get document |
| PUT | `/api/documents/[id]` | Update document |
| DELETE | `/api/documents/[id]` | Delete document |
| GET | `/api/documents/[id]/versions` | Get version history |
| GET | `/api/documents/[id]/citations` | Get source citations |
| GET | `/api/documents/stale` | Find stale documents |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reviews` | List reviews |
| POST | `/api/reviews` | Create review |
| GET | `/api/reviews/[id]` | Get review |
| PUT | `/api/reviews/[id]` | Update review status |
| POST | `/api/reviews/assign` | Assign reviewer |

### AI Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/agents/review` | Run code review |
| POST | `/api/agents/code-assistant` | Chat with code assistant |
| POST | `/api/agents/code-assistant/analyze` | Analyze codebase |
| POST | `/api/assistant/chat` | RAG documentation chat |

### Other
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/metrics` | Get dashboard metrics |
| GET | `/api/dashboard/activity` | Get activity feed |
| GET | `/api/search` | Full-text search |
| GET | `/api/audit` | Get audit logs |
| GET/POST | `/api/conversations` | Chat conversations |

---

## Database Schema

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed ER diagrams.

**17 models:**
- `User` — User accounts
- `Workspace` — Multi-tenant workspaces
- `Membership` — User-workspace roles
- `SourceConnection` — GitHub/OpenAPI sources
- `RepoFile` — Synced source files
- `GeneratedDocument` — AI-generated docs
- `DocumentVersion` — Version history
- `GenerationJob` — Generation tracking
- `Review` — Section-level reviews
- `ReviewAssignment` — Reviewer assignments
- `AuditLog` — Action audit trail
- `DocSourceLink` — Doc-source relationships
- `JobSourceLink` — Job-source snapshots
- `ApiKey` — API key management
- `ChatConversation` — Chat sessions
- `ChatMessage` — Chat messages

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
