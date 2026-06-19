# Architecture

Technical architecture of DocFlow AI — an AI-powered documentation platform.

---

## System Overview

```mermaid
graph TB
    subgraph Frontend["Frontend (Next.js 16)"]
        UI["React UI<br/>Tailwind CSS + Framer Motion"]
        CP["Command Palette<br/>⌘K"]
        Theme["Theme System<br/>Dark/Light"]
    end

    subgraph API["API Layer (30+ Routes)"]
        Auth["Auth<br/>JWT + bcrypt"]
        Sources["Sources API<br/>CRUD + Sync"]
        Docs["Documents API<br/>CRUD + Versions"]
        Reviews["Reviews API<br/>CRUD + Assignment"]
        Agents["AI Agents<br/>Review + Code Assistant"]
        Search["Search API<br/>Full-text"]
    end

    subgraph AI["AI Layer"]
        NVIDIA["NVIDIA API<br/>Llama 3.1 8B"]
        Generator["Doc Generator<br/>Template + AI"]
        RAG["RAG Assistant<br/>Keyword Search"]
    end

    subgraph Data["Data Layer"]
        DB[("SQLite / Turso<br/>17 Models")]
        Cache["In-Memory Cache<br/>Prisma Global"]
    end

    subgraph External["External APIs"]
        GitHub["GitHub API<br/>Repo Sync"]
        OpenAPI["OpenAPI Spec<br/>Endpoint Parsing"]
    end

    UI --> API
    CP --> API
    API --> Data
    API --> AI
    API --> External
    AI --> NVIDIA
    Generator --> NVIDIA
    RAG --> DB
```

---

## Database Schema (ER Diagram)

```mermaid
erDiagram
    User ||--o{ Membership : has
    User ||--o{ Review : reviews
    User ||--o{ AuditLog : logs
    User ||--o{ ReviewAssignment : assigned
    User ||--o{ ChatConversation : chats

    Workspace ||--o{ Membership : contains
    Workspace ||--o{ SourceConnection : has
    Workspace ||--o{ GeneratedDocument : has
    Workspace ||--o{ GenerationJob : has
    Workspace ||--o{ ApiKey : has
    Workspace ||--o{ AuditLog : logs
    Workspace ||--o{ ChatConversation : has

    SourceConnection ||--o{ RepoFile : contains
    SourceConnection ||--o{ DocSourceLink : links
    SourceConnection ||--o{ JobSourceLink : snapshots

    GeneratedDocument ||--o{ DocumentVersion : versions
    GeneratedDocument ||--o{ Review : reviews
    GeneratedDocument ||--o{ DocSourceLink : links
    GeneratedDocument ||--o{ ReviewAssignment : assignments

    GenerationJob ||--o{ JobSourceLink : uses

    ChatConversation ||--o{ ChatMessage : messages

    User {
        string id PK
        string email UK
        string name
        string password
        datetime createdAt
        datetime updatedAt
    }

    Workspace {
        string id PK
        string name
        string slug UK
        string aiApiKey
        string aiProvider
        string aiModel
        datetime createdAt
        datetime updatedAt
    }

    Membership {
        string id PK
        string role
        string userId FK
        string workspaceId FK
    }

    SourceConnection {
        string id PK
        string sourceType
        string label
        string status
        datetime lastSyncAt
        int contentVolume
        string repositoryUrl
        string token
        string workspaceId FK
    }

    RepoFile {
        string id PK
        string path
        string content
        string sha
        datetime syncAt
        string sourceId FK
    }

    GeneratedDocument {
        string id PK
        string title
        string slug
        string description
        string content
        string status
        string docType
        int version
        boolean isPublished
        string sourceHash
        string workspaceId FK
    }

    DocumentVersion {
        string id PK
        int version
        string title
        string content
        string description
        datetime createdAt
        string documentId FK
    }

    GenerationJob {
        string id PK
        string type
        string status
        int progress
        string message
        string triggerType
        string workspaceId FK
        string resultDocumentId
    }

    Review {
        string id PK
        string status
        string comment
        int sectionIdx
        string sectionLabel
        string documentId FK
        string reviewerId FK
    }

    ReviewAssignment {
        string id PK
        string status
        string documentId FK
        string assigneeId FK
    }

    AuditLog {
        string id PK
        string action
        string entityType
        string entityId
        string details
        string workspaceId FK
        string userId FK
    }

    DocSourceLink {
        string id PK
        string fileContentHash
        datetime lastCheckedAt
        boolean stale
        string documentId FK
        string sourceFileId FK
        string sourceId FK
    }

    JobSourceLink {
        string id PK
        string filePath
        string fileContent
        string jobId FK
        string sourceId FK
    }

    ApiKey {
        string id PK
        string label
        string key UK
        string prefix
        datetime lastUsedAt
        datetime expiresAt
        boolean isRevoked
        string workspaceId FK
    }

    ChatConversation {
        string id PK
        string title
        string userId FK
        string workspaceId FK
    }

    ChatMessage {
        string id PK
        string role
        string content
        string citations
        string conversationId FK
    }
```

---

## Auth Flow

```mermaid
sequenceDiagram
    participant U as Browser
    participant A as API Route
    participant P as Prisma
    participant DB as SQLite/Turso

    Note over U,DB: Sign Up
    U->>A: POST /api/auth/signup<br/>{email, password, name, workspaceName}
    A->>A: Validate input
    A->>A: Hash password (bcrypt)
    A->>P: Create User
    P->>DB: INSERT User
    A->>P: Create Workspace
    P->>DB: INSERT Workspace
    A->>P: Create Membership
    P->>DB: INSERT Membership
    A->>A: Generate JWT (jose)
    A->>U: Set httpOnly cookie + {user, workspace}

    Note over U,B: Sign In
    U->>A: POST /api/auth/signin<br/>{email, password}
    A->>P: Find User by email
    P->>DB: SELECT User
    A->>A: Verify password (bcrypt)
    A->>A: Generate JWT
    A->>U: Set httpOnly cookie + {user, workspace}

    Note over U,B: Authenticated Request
    U->>A: GET /api/documents<br/>Cookie: token=...
    A->>A: Verify JWT (jose)
    A->>A: Extract userId, workspaceId
    A->>P: Query with workspace scope
    A->>U: {documents}
```

---

## AI Generation Pipeline

```mermaid
flowchart TD
    Start([User clicks Generate]) --> SelectType[Select Document Type]
    SelectType --> SelectWorkflow{Choose Workflow}

    SelectWorkflow --> |README| Readme[Generate README]
    SelectWorkflow --> |API Reference| ApiRef[Generate API Ref]
    SelectWorkflow --> |Changelog| Changelog[Generate Changelog]
    SelectWorkflow --> |Setup Guide| Setup[Generate Setup Guide]
    SelectWorkflow --> |Troubleshoot| Troubleshoot[Generate Troubleshooting]
    SelectWorkflow --> |Help Center| Help[Generate Help Article]

    Readme --> FetchSources[Fetch Source Files]
    ApiRef --> FetchSources
    Changelog --> FetchSources
    Setup --> FetchSources
    Troubleshoot --> FetchSources
    Help --> FetchSources

    FetchSources --> |GitHub| FetchGitHub[Fetch via GitHub API]
    FetchSources --> |OpenAPI| FetchOpenAPI[Fetch Spec URL]
    FetchSources --> |Local| ReadFiles[Read File Content]

    FetchGitHub --> BuildPrompt[Build AI Prompt]
    FetchOpenAPI --> BuildPrompt
    ReadFiles --> BuildPrompt

    BuildPrompt --> |Template + Sources| CallNVIDIA[Call NVIDIA API<br/>Llama 3.1 8B]
    CallNVIDIA --> ParseResponse[Parse AI Response]
    ParseResponse --> CreateDoc[Create Document]
    CreateDoc --> CreateVersions[Create Version 1]
    CreateVersions --> CreateDocSourceLinks[Link Source Files]
    CreateDocSourceLinks --> ComputeHash[Compute SHA-256 Hash]
    ComputeHash --> CreateJob[Log Generation Job]
    CreateJob --> Done([Document Ready])
```

---

## Review Workflow

```mermaid
stateDiagram-v2
    [*] --> PENDING: Create Review
    PENDING --> ASSIGNED: Assign Reviewer
    ASSIGNED --> IN_REVIEW: Reviewer Starts
    IN_REVIEW --> APPROVED: Approve Section
    IN_REVIEW --> REJECTED: Reject Section
    IN_REVIEW --> CHANGES_REQUESTED: Request Changes
    APPROVED --> [*]
    REJECTED --> [*]
    CHANGES_REQUESTED --> PENDING: Re-submit

    note right of PENDING
        Review created with
        section label/idx
    end note

    note right of APPROVED
        AuditLog entry
        created automatically
    end note
```

```mermaid
sequenceDiagram
    participant U as User
    participant API as API
    participant DB as Database
    participant Audit as AuditLog

    U->>API: POST /api/reviews<br/>{documentId, reviewerId, status}
    API->>DB: Create Review
    API->>Audit: Log REVIEW_CREATED
    API->>U: {review}

    U->>API: POST /api/reviews/assign<br/>{reviewId, assigneeId}
    API->>DB: Create ReviewAssignment
    API->>Audit: Log REVIEW_ASSIGNED
    API->>U: {assignment}

    U->>API: PUT /api/reviews/[id]<br/>{status: APPROVED}
    API->>DB: Update Review
    API->>Audit: Log REVIEW_APPROVED
    API->>U: {review}
```

---

## Staleness Detection

```mermaid
flowchart TD
    Sync([Source Sync Triggered]) --> FetchFiles[Fetch Source Files]
    FetchFiles --> ForEach[For Each File]

    ForEach --> ComputeNew[Compute SHA-256 Hash]
    ComputeNew --> FindLink[Find DocSourceLink]
    FindLink --> |Exists| CompareHash{Hash Changed?}
    FindLink --> |New| CreateLink[Create DocSourceLink]

    CompareHash --> |No Change| MarkFresh[Mark as Fresh]
    CompareHash --> |Changed| MarkStale[Mark as Stale]

    MarkFresh --> Continue[Continue]
    MarkStale --> Continue
    CreateLink --> Continue

    Continue --> MoreFiles{More Files?}
    MoreFiles --> |Yes| ForEach
    MoreFiles --> |No| UpdateDoc[Update Document Staleness]
    UpdateDoc --> NotifyUser[Show Warning in Dashboard]
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph Client["Client"]
        Browser["Browser"]
    end

    subgraph Netlify["Netlify"]
        Edge["Edge Functions"]
        Functions["Serverless Functions"]
        Static["Static Assets"]
    end

    subgraph Turso["Turso (Edge DB)"]
        Primary["Primary DB<br/>SQLite"]
        Replica1["Replica<br/>US East"]
        Replica2["Replica<br/>EU West"]
        Replica3["Replica<br/>Asia Pacific"]
    end

    subgraph NVIDIA["NVIDIA Cloud"]
        LLM["Llama 3.1 8B<br/>Instruct"]
    end

    subgraph GitHub["GitHub"]
        API["GitHub API"]
        Repos["User Repos"]
    end

    Browser --> Netlify
    Edge --> Functions
    Functions --> Turso
    Functions --> NVIDIA
    Functions --> GitHub
    Primary --> Replica1
    Primary --> Replica2
    Primary --> Replica3

    style Netlify fill:#00C7B7,color:#000
    style Turso fill:#4FF8D2,color:#000
    style NVIDIA fill:#76B900,color:#000
    style GitHub fill:#24292E,color:#fff
```

---

## Component Architecture

```mermaid
graph LR
    subgraph Pages["Pages"]
        Landing["Landing<br/>/"]
        Signin["Signin<br/>/signin"]
        Signup["Signup<br/>/signup"]
        Dashboard["Dashboard<br/>/app/dashboard"]
        Sources["Sources<br/>/app/sources"]
        Documents["Documents<br/>/app/documents"]
        Generate["Generate<br/>/app/generate"]
        Reviews["Reviews<br/>/app/reviews"]
        ReviewAgent["Review Agent<br/>/app/review-agent"]
        Assistant["Assistant<br/>/app/assistant"]
        CodeAssistant["Code Assistant<br/>/app/code-assistant"]
        Portal["Portal<br/>/app/portal"]
        Settings["Settings<br/>/app/settings"]
    end

    subgraph Components["Shared Components"]
        Sidebar["Sidebar"]
        Topbar["Topbar"]
        CommandPalette["Command Palette<br/>⌘K"]
        Toast["Toast Notifications"]
        Skeleton["Loading Skeletons"]
    end

    subgraph Hooks["Hooks"]
        UseHotkey["useHotkey"]
        UseTheme["useTheme"]
    end

    Dashboard --> Sidebar
    Dashboard --> Topbar
    Dashboard --> CommandPalette
    Sources --> Sidebar
    Sources --> Topbar
    Documents --> Sidebar
    Documents --> Topbar
    Generate --> Sidebar
    Generate --> Topbar
    Reviews --> Sidebar
    Reviews --> Topbar
    ReviewAgent --> Sidebar
    ReviewAgent --> Topbar
    Assistant --> Sidebar
    Assistant --> Topbar
    CodeAssistant --> Sidebar
    CodeAssistant --> Topbar
    Portal --> Sidebar
    Portal --> Topbar
    Settings --> Sidebar
    Settings --> Topbar

    Topbar --> CommandPalette
    Dashboard --> UseHotkey
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **SQLite + Turso** | Local dev with file SQLite, production with edge-hosted Turso for persistence |
| **JWT over localStorage** | httpOnly cookies prevent XSS attacks |
| **bcryptjs (pure JS)** | Avoids native compilation issues across platforms |
| **Keyword search over vectors** | No vector DB dependency; RegExp scoring sufficient for MVP |
| **SHA-256 for staleness** | Content-based change detection without external webhooks |
| **NVIDIA Llama 3.1** | Free tier available, OpenAI-compatible API, good for code tasks |
| **Section-level reviews** | Finer granularity than document-level approve/reject |
| **Prisma global singleton** | Prevents connection exhaustion in serverless environments |
| **Prisma driver adapters** | Enables Turso/LibSQL without changing application code |
