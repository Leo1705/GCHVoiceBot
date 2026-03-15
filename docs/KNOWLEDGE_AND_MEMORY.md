# Teaching the Voice Assistant: Knowledge Base & User Memory

This doc describes how we make the assistant **accurate**, **personal**, and **consistent** by:
1. **Knowledge base** – Your PDFs, text, and resources so answers match your content.
2. **RAG (Retrieval-Augmented Generation)** – At answer time we pull only the relevant bits of that knowledge into the LLM so it resonates and stays on-brand.
3. **User memory** – Remember what the person said so future conversations can reference it (“Last time you mentioned…”).

---

## Current vs target

| Today | Target |
|-------|--------|
| Hardcoded mock responses + keyword matching | **Real LLM** (e.g. OpenAI) with dynamic answers |
| No uploaded content | **Upload PDFs/text** → chunked, searchable knowledge |
| No memory across sessions | **User memory**: store key facts, load each session |

---

## 1. Knowledge base (your PDFs & text)

- **Upload**: PDF, `.txt`, or paste text in the dashboard (or an admin area).
- **Processing**:
  - Extract text (PDF → text via library).
  - Split into **chunks** (e.g. by paragraph or ~500 tokens) with overlap so context isn’t cut mid-sentence.
- **Storage**:
  - **Simple**: Store chunks in JSON/DB; at answer time send “all knowledge” or a summary (works for small docs).
  - **RAG**: Generate **embeddings** per chunk (OpenAI or other), store in a vector store (e.g. file-based, Supabase pgvector, Pinecone). On each user message, embed the message → retrieve top‑k relevant chunks → send only those to the LLM.

Result: The model’s answers are grounded in **your** materials so they resonate and stay accurate.

---

## 2. RAG (retrieval-augmented generation)

1. User speaks → transcript.
2. **Retrieve**: Embed transcript (and maybe last assistant message), search vector store, get top 3–5 chunks.
3. **Prompt**: System prompt + “Use only this context when relevant: …” + retrieved chunks + conversation history + user memory.
4. LLM returns one short, voice-friendly reply.

This keeps responses accurate and on-topic without stuffing the whole knowledge base into every request.

---

## 3. User memory (remember answers for future conversations)

- **What to remember**: Things the user said about themselves (e.g. name, what they’re working on, preferences, past events).
- **How**:
  - **Option A (no backend)**: After each turn, optionally call the LLM to “extract 1–3 short facts from this exchange” → store in `localStorage` (e.g. `gch_user_memory`) and send that list with every request.
  - **Option B (with backend)**: Same extraction, but store in a DB keyed by `userId` (or anonymous id). Each session start: load memory and pass into the system prompt.
- **Usage**: In the system prompt: “Known about the user: …” so the assistant can say “Last time you mentioned your job was stressful” or “You said you prefer short steps.”

---

## 4. Implementation outline

- **`/api/chat`**  
  - Input: `transcript`, `conversation[]`, `mode`, `userMemory[]`, optional `knowledgeContext` or `retrievedChunks[]`.  
  - Uses a **real LLM** (e.g. OpenAI) with a system prompt that includes: role (supportive voice assistant), mode, user memory, and knowledge.  
  - Returns: `responseText`, and optionally `factsToRemember[]` for the client to persist.

- **`/api/ingest`**  
  - Input: file (PDF) or raw text.  
  - Chunks text, optionally generates embeddings and stores them (or just stores chunks).  
  - Returns: `ok`, `chunksCount`.

- **Client (session page)**  
  - Load `userMemory` from `localStorage` (or from backend if logged in).  
  - On each voice turn: send transcript + conversation + mode + userMemory to `/api/chat`; append returned `factsToRemember` to user memory.  
  - For RAG: either client calls an endpoint that returns “context for this message” or `/api/chat` does retrieval internally.

- **Admin only (not visible to users)**  
  - Go to **`/admin/knowledge`** (not linked in the app). Enter your **ADMIN_SECRET** (from `.env.local`), then paste text or upload PDF/.txt. This calls `POST /api/ingest` with header `X-Admin-Secret`. Ingested content is used in legacy mode as knowledge context in `/api/chat`.  
  - For **ElevenLabs agent mode**, configure the agent’s knowledge base in the [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai) dashboard.

---

## 5. Making it “resonate”

- **Tone in system prompt**: Short, warm, one idea at a time, voice-friendly; reflect back; ask one clear question.
- **Knowledge in prompt**: “Use the following only when relevant to the user’s question: …”
- **User memory in prompt**: “What we know about the user: … Use this to personalize and remember.”
- **Safety**: Keep your existing safety layer (unsafe phrases → fixed safety response, no LLM).

Once this is in place, the “answering machine” is taught by your PDFs/text, and it remembers the person’s answers for future conversations.

---

## Quick setup

1. **Real LLM (optional)**  
   Create `.env.local` and set `OPENAI_API_KEY=sk-...`. Without it, the app still works using the existing keyword-based mock responses.

2. **Teach the assistant**  
   On the dashboard, use **“Teach the assistant”**: paste text or upload a PDF/.txt file. Content is chunked and stored under `data/knowledge.json` and used automatically in every chat.

3. **User memory**  
   The client sends `userMemory` (from `localStorage` key `gch_user_memory`) with each request. When the backend returns `factsToRemember`, the client appends them. For automatic fact extraction from conversations, you can add a follow-up LLM call that returns 1–3 short facts to remember.
