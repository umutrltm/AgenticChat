# Agentic Chat with Long-Term Memory

A minimal LLM-driven chat agent built with Node.js that features:
- REST API for chat interactions
- SQLite-based long-term memory with semantic search
- Agent tools for database CRUD operations
- Text embeddings for semantic memory recall

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure Google Cloud 
cp env.example .env
# Edit .env with your project ID

# 3. Start server
npm start

# 4. Run demo (in another terminal)
./test-demo.sh
```

**Database is auto-created on first run!** No manual setup needed.

## Features

- **Chat API**: `/chat` endpoint for conversational interactions
- **Agent Tools**:
  - `db.create`, `db.read`, `db.update` for managing contacts
  - `memory.remember` to store memories with embeddings
  - `memory.recall` for semantic search of past interactions
- **Semantic Memory**: Uses text embeddings and cosine similarity for intelligent recall
- **CRUD Endpoints**: Manual testing endpoints for contacts and memory

## Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your Google Cloud project details
```

3. **Set up Google Cloud credentials**:
```bashkod
# Make sure you have gcloud CLI installed and authenticated
gcloud auth application-default login
```

4. **Start the server**:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

## API Reference

### Chat Endpoint

**POST** `/chat`

Request:
```json
{
  "sessionId": "optional-session-id",
  "message": "Add Alice (alice@example.com) as a VIP"
}
```

Response:
```json
{
  "reply": "Added Alice as a VIP.",
  "toolsUsed": ["db.create", "memory.remember"],
  "trace": [
    {
      "tool": "db.create",
      "args": {
        "name": "Alice",
        "email": "alice@example.com",
        "vip": true
      }
    }
  ]
}
```

### CRUD Endpoints

- **GET** `/contacts` - List all contacts
- **POST** `/contacts` - Create a contact
- **PATCH** `/contacts/:id` - Update a contact
- **GET** `/memory/search?q=conference&k=5` - Search memories

## Demo Journeys

### 1. Add + Recall
```bash
# Add a VIP contact
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "demo-1",
    "message": "Add Alice (alice@example.com) as a VIP"
  }'

# Query VIPs
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "demo-1",
    "message": "Who are my VIPs?"
  }'

# Recall what was added
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "demo-1",
    "message": "What did we add earlier?"
  }'
```

### 2. Update
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "demo-1",
    "message": "Mark Alice as not VIP and note met at conference"
  }'
```

### 3. Semantic Recall
```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "demo-1",
    "message": "Who did we meet at the conference?"
  }'
```

## Architecture

- **Express.js**: REST API server
- **better-sqlite3**: Fast, synchronous SQLite database
- **Vertex AI**: LLM (Gemini) and text embeddings
- **Function Calling**: Agent tool orchestration via LLM function calling

## Database Schema

### Contacts Table
- `id`: INTEGER PRIMARY KEY
- `name`: TEXT NOT NULL
- `email`: TEXT UNIQUE
- `vip`: BOOLEAN DEFAULT 0
- `notes`: TEXT
- `created_at`: DATETIME
- `updated_at`: DATETIME

### Memory Table
- `id`: INTEGER PRIMARY KEY
- `session_id`: TEXT
- `text`: TEXT NOT NULL
- `embedding`: BLOB (JSON array of floats)
- `metadata`: TEXT (JSON)
- `created_at`: DATETIME

## License

MIT
