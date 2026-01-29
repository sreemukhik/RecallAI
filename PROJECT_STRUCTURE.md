# RecallAI - Project Structure

## Overview
RecallAI is a full-stack personal memory assistant with AI-powered semantic search and query capabilities.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Python FastAPI
- **Database**: SQLite (metadata) + ChromaDB (vector embeddings)
- **AI**: Groq API (LLM for intelligent responses)
- **Embeddings**: Custom hash-based embedding service

---

## Project Structure

```
RecallAI/
│
├── backend/                          # Python FastAPI Backend
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── api.py           # API router aggregator
│   │   │       └── endpoints/
│   │   │           ├── auth.py      # Authentication endpoints (signup/login)
│   │   │           ├── ingest.py    # Memory upload endpoints
│   │   │           └── query.py     # AI-powered query endpoints
│   │   │
│   │   ├── core/
│   │   │   ├── config.py            # App configuration & settings
│   │   │   ├── database.py          # SQLAlchemy database setup
│   │   │   └── security.py          # JWT authentication logic
│   │   │
│   │   ├── models/
│   │   │   ├── user.py              # User database model
│   │   │   └── document.py          # Document/memory database model
│   │   │
│   │   ├── schemas/
│   │   │   ├── user.py              # User Pydantic schemas
│   │   │   └── document.py          # Document Pydantic schemas
│   │   │
│   │   ├── services/
│   │   │   ├── embedding.py         # Hash-based embedding service
│   │   │   └── vector_store.py      # ChromaDB vector operations
│   │   │
│   │   └── main.py                  # FastAPI app entry point
│   │
│   ├── chroma_db/                   # ChromaDB persistent storage
│   ├── venv/                        # Python virtual environment
│   ├── .env                         # Environment variables (GROQ_API_KEY)
│   ├── requirements.txt             # Python dependencies
│   ├── sql_app.db                   # SQLite database file
│   └── Dockerfile                   # Docker configuration
│
├── src/                             # React Frontend Source
│   ├── components/
│   │   ├── ui/                      # Reusable UI components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   └── ... (other shadcn/ui components)
│   │   │
│   │   ├── Dashboard.tsx            # Main dashboard page
│   │   ├── IngestPage.tsx           # Memory upload interface
│   │   ├── QueryPage.tsx            # AI query interface
│   │   ├── LoginPage.tsx            # User login
│   │   └── SignupPage.tsx           # User registration
│   │
│   ├── contexts/
│   │   └── AuthContext.tsx          # Authentication state management
│   │
│   ├── utils/
│   │   ├── api.ts                   # API client utilities
│   │   └── supabase.ts              # Legacy Supabase config (unused)
│   │
│   ├── App.tsx                      # Main React app component
│   ├── main.tsx                     # React entry point
│   └── index.css                    # Global styles
│
├── public/                          # Static assets
│   └── vite.svg
│
├── node_modules/                    # NPM dependencies
├── package.json                     # NPM configuration
├── package-lock.json
├── tsconfig.json                    # TypeScript configuration
├── vite.config.ts                   # Vite build configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── postcss.config.js                # PostCSS configuration
├── components.json                  # shadcn/ui configuration
├── eslint.config.js                 # ESLint configuration
└── README.md                        # Project documentation
```

---

## Key Files Explained

### Backend

**`backend/app/main.py`**
- FastAPI application entry point
- Configures CORS, database, and API routes
- Runs on `http://localhost:8000`

**`backend/app/core/config.py`**
- Centralized configuration
- Loads environment variables from `.env`
- Contains Groq API key, database paths, JWT settings

**`backend/app/services/embedding.py`**
- Custom hash-based embedding generation
- Converts text to 384-dimensional vectors
- Enables semantic similarity search

**`backend/app/services/vector_store.py`**
- ChromaDB integration
- Stores and retrieves vector embeddings
- Enforces user-level data isolation

**`backend/.env`**
```
GROQ_API_KEY=gsk_...
```

### Frontend

**`src/App.tsx`**
- Main application router
- Handles navigation between pages
- Protected route logic

**`src/components/QueryPage.tsx`**
- AI-powered query interface
- Sends questions to `/api/v1/query/`
- Displays Groq-generated answers with sources

**`src/components/IngestPage.tsx`**
- Memory upload interface
- Sends text to `/api/v1/ingest/`
- Chunks and embeds content automatically

**`src/utils/api.ts`**
- Centralized API client
- Handles authentication headers
- Base URL: `http://localhost:8000/api/v1`

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Create new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Memory Management
- `POST /api/v1/ingest/` - Upload new memory
- `GET /api/v1/ingest/` - List all memories
- `GET /api/v1/ingest/stats` - Get usage statistics
- `DELETE /api/v1/ingest/{doc_id}` - Delete specific memory
- `DELETE /api/v1/ingest/` - Delete all memories

### AI Query
- `POST /api/v1/query/` - Ask questions about your memories
  - Returns AI-generated answer + relevant source documents

---

## Data Flow

1. **Upload Memory**:
   ```
   User → IngestPage → POST /ingest/ → Embedding Service → ChromaDB + SQLite
   ```

2. **Query Memory**:
   ```
   User → QueryPage → POST /query/ → Vector Search → Groq AI → Response
   ```

3. **Authentication**:
   ```
   User → Login → JWT Token → Stored in localStorage → Sent with all requests
   ```

---

## Environment Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

### Frontend
```bash
npm install
npm run dev
```

---

## Database Schema

### Users Table (SQLite)
- `id` (Primary Key)
- `email` (Unique)
- `hashed_password`
- `created_at`

### Documents Table (SQLite)
- `id` (Primary Key)
- `user_id` (Foreign Key → Users)
- `title`
- `content`
- `created_at`

### Vector Store (ChromaDB)
- Collection: `user_memories`
- Metadata: `user_id`, `doc_id`, `chunk_index`
- Embeddings: 384-dimensional vectors
- Distance metric: Cosine similarity

---

## Configuration

### Backend Port
- Default: `8000`
- Change in: `backend/app/core/config.py`

### Frontend Port
- Default: `5173` (Vite dev server)
- Change in: `vite.config.ts`

### API Base URL
- Frontend config: `src/utils/api.ts`
- Current: `http://localhost:8000/api/v1`

---

## Dependencies

### Backend (`requirements.txt`)
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `sqlalchemy` - ORM
- `chromadb` - Vector database
- `groq` - LLM API client
- `pydantic` - Data validation
- `python-jose` - JWT handling
- `passlib` - Password hashing
- `numpy` - Numerical operations

### Frontend (`package.json`)
- `react` - UI library
- `react-router-dom` - Routing
- `vite` - Build tool
- `typescript` - Type safety
- `tailwindcss` - Styling
- `shadcn/ui` - UI components

---

## Security Features

1. **JWT Authentication** - Secure token-based auth
2. **Password Hashing** - Argon2 algorithm
3. **User Isolation** - Vector search filtered by user_id
4. **CORS Protection** - Configured for localhost development
5. **Environment Variables** - Sensitive keys in `.env`

---

## Future Enhancements

- [ ] Upgrade to neural embeddings (sentence-transformers)
- [ ] Add file upload support (PDF, DOCX)
- [ ] Implement conversation history
- [ ] Add export/import functionality
- [ ] Deploy to production (Docker + cloud hosting)
