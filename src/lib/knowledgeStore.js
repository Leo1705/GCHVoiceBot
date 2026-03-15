/**
 * Simple file-based knowledge store for RAG.
 * Chunks are stored in data/knowledge.json (created if missing).
 * Optional: add embeddings later for similarity search.
 */

import fs from "fs";
import path from "path";

const DATA_DIR = process.cwd() + "/data";
const KNOWLEDGE_FILE = path.join(DATA_DIR, "knowledge.json");

const MAX_CONTEXT_CHARS = 6000; // max chars to send as knowledgeContext to LLM

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadChunks() {
  ensureDataDir();
  if (!fs.existsSync(KNOWLEDGE_FILE)) return [];
  try {
    const raw = fs.readFileSync(KNOWLEDGE_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.chunks) ? data.chunks : [];
  } catch {
    return [];
  }
}

function saveChunks(chunks) {
  ensureDataDir();
  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify({ chunks, updatedAt: new Date().toISOString() }, null, 2), "utf8");
}

/**
 * Chunk text by paragraphs, then by size. Aim for ~400–600 chars per chunk with overlap.
 */
export function chunkText(text, maxChunkSize = 600, overlap = 80) {
  if (!text || typeof text !== "string") return [];
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n\s*\n/).filter((p) => p.trim());
  const chunks = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length + 1 <= maxChunkSize) {
      current = current ? current + "\n\n" + para : para;
    } else {
      if (current) chunks.push(current.trim());
      if (para.length > maxChunkSize) {
        for (let i = 0; i < para.length; i += maxChunkSize - overlap) {
          chunks.push(para.slice(i, i + maxChunkSize).trim());
        }
        current = "";
      } else {
        current = para;
      }
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

/**
 * Add new chunks to the store (append).
 */
export function addChunks(newChunks) {
  const chunks = loadChunks();
  const added = [...chunks, ...newChunks];
  saveChunks(added);
  return added.length;
}

/**
 * Get all chunks concatenated up to MAX_CONTEXT_CHARS for use as knowledgeContext in the LLM.
 */
export function getKnowledgeContext() {
  const chunks = loadChunks();
  let out = "";
  for (const c of chunks) {
    if (out.length + c.length + 2 > MAX_CONTEXT_CHARS) break;
    out = out ? out + "\n\n" + c : c;
  }
  return out;
}

/**
 * Replace entire store with new chunks (e.g. after re-ingest).
 */
export function setChunks(chunks) {
  saveChunks(chunks || []);
  return (chunks || []).length;
}
