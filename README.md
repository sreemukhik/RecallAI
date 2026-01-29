# RecallAI: Privacy-First Personal Memory Assistant

RecallAI is a privacy-focused application that acts as your "second brain." It allows you to ingest notes, conversations, and documents, and then uses AI to let you query and chat with your own data.

**Key Philosophy:** Your data is yours. All memories are stored locally and encrypted. They are never shared with third parties or used to train public models.

## Features

*   **Smart Ingestion:** Upload text notes, meeting logs, or journals. Content is automatically chunked and embedded for semantic search.
*   **Semantic Search:** Don't just match keywords. Ask questions in natural language (e.g., "What did we discuss about the project timeline?") and get relevant answers.
*   **AI-Powered Answers:** Uses `Llama-3` (via Groq) to generate concise, context-aware answers based strictly on your uploaded memories.
*   **Privacy First:**
    *   Local vector database (ChromaDB).
    *   No data sent to cloud storage providers.
    *   AI only sees the specific snippets relevant to your current question.
*   **Modern Stack:** Built with React, Vite, TailwindCSS, FastAPI, and SQLAlchemy.

---

## Tech Stack

### Frontend
- **React (Vite)**: Fast, modern UI library.
- **TailwindCSS**: Utility-first styling for a sleek, responsive design.
- **Lucide React**: Beautiful, consistent icons.
- **TypeScript**: For type-safe, maintainable code.

### Backend
- **FastAPI**: High-performance Python web framework.
- **ChromaDB**: Local vector database for storing and retrieving memory embeddings.
- **SQLAlchemy (SQLite)**: Relational database for user management and metadata.
- **Groq API**: Ultra-fast inference API for the Llama-3 LLM.
- **Sentence-Transformers**: Local embedding generation (all-MiniLM-L6-v2) for zero-latency vectorization.

---

## Getting Started

Follow these instructions to set up the project locally.

### Prerequisites
- **Node.js** (v18+)
- **Python** (3.10+)
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/RecallAI.git
cd RecallAI
```

### 2. Backend Setup
The backend handles authentication, vector storage, and AI processing.

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
.\venv\Scripts\Activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file
# Copy the example or create new one:
# GROQ_API_KEY=your_groq_api_key_here
# SECRET_KEY=your_secure_random_secret_key
# ALGORITHM=HS256
# ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Run the Backend:**
```bash
uvicorn app.main:app --reload
```
*The backend runs on `http://localhost:8000`.*

### 3. Frontend Setup
The frontend is the user interface for managing your memories.

```bash
# Open a new terminal and go to the project root
cd RecallAI

# Install dependencies
npm install

# Run the development server
npm run dev
```
*The frontend runs on `http://localhost:3000`.*

---

## Usage Guide

1.  **Sign Up/Login:** Create a new local account. Your data is isolated to your user ID.
2.  **Add Memory:** Go to the "Add Memory" page. Paste in any text (e.g., "Meeting notes from today...").
3.  **Query:** Go to the "Query" page. Ask a question like "What were the action items from the meeting?".
4.  **View Memories:** Browse your saved data on the "Memories" page. You can delete outdated items here.

---

## Privacy & Security

*   **Local Storage:** All vector data lives in `./backend/chroma_db` and user data in `./backend/sql_app.db`.
*   **Encryption:** (Planned) Future updates will include at-rest encryption for the SQLite database.
*   **API Usage:** The only external call is to the Groq API for *generation*. Only the specific text chunks relevant to your query are sent to the LLM.

---

## Contributing

Contributions are welcome!
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.