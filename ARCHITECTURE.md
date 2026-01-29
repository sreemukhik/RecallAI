# 🧠 Recall AI — Architecture & System Design

## 1. High-Level Architecture

Recall AI is designed as a stateless, scalable, and privacy-centric memory system. The architecture follows a microservices-ready modular monolith pattern, easily splittable as load increases.

```mermaid
graph TD
    User[User Client (Web/Mobile)] -->|HTTPS/REST| LB[Load Balancer]
    LB --> API[FastAPI Backend Service]
    
    subgraph "Core Backend"
        API -->|Auth & User Mgmt| Auth[Auth Service (JWT)]
        API -->|Ingest Text| Ingest[Ingestion Pipeline]
        API -->|Semantic Search| Retrieve[Retrieval Service]
    end

    subgraph "Data Storage (Per-User Isolation)"
        Ingest -->|Metadata & Logs| SQL[(Relational DB - PostgreSQL)]
        Ingest -->|Text Chunks + Embeddings| VectorDB[(Vector DB - Chroma/FAISS)]
        Retrieve -->|Query Vectors| VectorDB
        Retrieve -->|Fetch Metadata| SQL
    end

    subgraph "AI Services"
        Ingest -->|Generate Embeddings| EmbedModel[Embedding Service (Transformer)]
        Retrieve -->|RAG Inference| LLM[LLM Inference (External/Local)]
    end

    Auth -.->|Enforce Scope| SQL
```

### **Component Overview**
1.  **FastAPI Backend**: The entry point. Stateless, async, handling request validation and routing.
2.  **Auth Service**: Issues JWTs. **Crucially**, every token embeds the `user_id`. This `user_id` is the **root of trust** for all downstream data access.
3.  **Ingestion Pipeline**: 
    *   Receives text.
    *   **Chunks** text (optimized for semantic boundaries).
    *   **Embeds** chunks using a Transformer model.
    *   **Stores** vectors + metadata.
4.  **Vector Store (ChromaDB)**: Stores embeddings. **Isolation Strategy**: Uses `user_id` as a mandatory metadata filter on *every* query.
5.  **Relational DB (PostgreSQL/SQLite)**: Stores user profiles, document raw text (encrypted at rest), and access logs.
6.  **RAG Engine**: Orchestrates the "Retrieve-then-Generate" flow, ensuring only the calling user's data is injected into the LLM context.

---

## 2. Key Design Decisions & Justification

| component | Decision | Justification |
| :--- | :--- | :--- |
| **API Framework** | **FastAPI (Python)** | High performance (async), native Pydantic integration for validation, auto-generated docs (Swagger), huge AI ecosystem support. |
| **Database** | **PostgreSQL** | ACID compliance for user data, robust relational mapping, extensible (pgvector support if needed later). SQLite used for local/dev. |
| **Vector Store** | **ChromaDB** | Open-source, supports metadata filtering (critical for isolation), easy to self-host (free), lightweight compared to managed solutions. |
| **Auth** | **JWT (Stateless)** | No server-side session storage needed (scalability). Token contains signed user identity, passing context seamlessly to services. |
| **Embeddings** | **Sentence-Transformers** | `all-MiniLM-L6-v2` is fast, free, and runs locally on CPU, avoiding external API costs/latency for the core vector loop. |

---

## 3. Data Isolation Strategy (Strict)

Privacy is the primary feature. We use **Logical Isolation** with strict software enforcement.

### **Database Level**
*   **Relational**: Every table (`Documents`, `Chunks`) has a `user_id` column.
*   **Query Enforcement**: The ORM/Service layer checks `current_user.id` against the `user_id` column for *every* read/write.
*   **Encryption**: Sensitive text fields are encrypted at rest (e.g., using Fernet/AES), with keys managed securely.

### **Vector DB Level (The Critical Path)**
*   Vector DBs are often flat. We enforce isolation via **Metadata Filtering**.
*   **Write**: When adding vectors, `{'user_id': <id>}` is attached as immutable metadata.
*   **Read**: The `query` function in the vector store abstraction **must** inject a filter: `where={"user_id": user.id}`.
*   **SafetyNet**: The service layer explicitly rejects any query without a user context.

---

## 4. Data Lifecycle

1.  **Ingestion**:
    *   User uploads Text/PDF.
    *   System validates format and file size.
    *   **Sanitization**: PII stripping (optional but recommended).
    *   **Chunking**: Recursive character splitter (overlap 10-20%) to maintain context.
    *   **Embedding**: Chunks -> Vectors.
    *   **Storage**: Vectors -> Chroma (with `user_id`), Metadata -> Postgres.
2.  **Retrieval**:
    *   User asks generic query ("What did I say about X?").
    *   System converts query to Vector.
    *   System performs **Filtered K-NN Search** (Result MUST match `user_id`).
    *   Top K results returned.
3.  **Deletion**:
    *   **Hard Delete**: When a user deletes a document, we execute a delete interface on both DBs using the `doc_id` and `user_id`. GDPR compliant.
    *   **Account Deletion**: Cascading delete on `user_id`.

---

## 5. Scalability Considerations

*   **Stateless API**: The backend can scale horizontally (multiple replicas) behind a load balancer easily.
*   **Async Ingestion**: For heavy loads, the Ingestion Pipeline functions can be offloaded to a task queue (Celery/Redis), preventing API blocking.
*   **Database Swapping**: The use of ORM (SQLAlchemy) and Vector Abstraction allows switching from SQLite/Chroma to RDS/Pinecone without logic changes.

---

## 6. Privacy-by-Design Principles

1.  **Data Minimization**: Only store what is needed for recall.
2.  **Purpose Limitation**: User data is used *only* for their own recall, never for training global models.
3.  **Right to be Forgotten**: One-click wipe of all user vectors and logs.
4.  **Security**: TLS for transit, AES for storage, Strict Access Control Lists (ACLs) in code.
