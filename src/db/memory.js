import db from './schema.js';
import { generateEmbeddings, generateQueryEmbedding, cosineSimilarity } from '../services/embeddings.js';

export class MemoryDB {
  /**
   * Store a memory with its embedding
   * @param {string} text - The text to remember
   * @param {string} sessionId - Optional session identifier
   * @param {object} metadata - Optional metadata
   * @returns {Promise<object>} The stored memory record
   */
  static async remember(text, sessionId = null, metadata = null) {
    // Generate embedding
    const [embedding] = await generateEmbeddings([text]);
    
    const stmt = db.prepare(`
      INSERT INTO memory (session_id, text, embedding, metadata)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      sessionId,
      text,
      JSON.stringify(embedding),
      metadata ? JSON.stringify(metadata) : null
    );

    return {
      id: result.lastInsertRowid,
      sessionId,
      text,
      metadata: metadata || {},
      created_at: new Date().toISOString()
    };
  }

  /**
   * Recall memories using semantic search
   * @param {string} query - The search query
   * @param {number} k - Number of results to return
   * @param {string} sessionId - Optional session filter
   * @returns {Promise<Array>} Top-k most similar memories
   */
  static async recall(query, k = 5, sessionId = null) {
    // Generate query embedding
    const queryEmbedding = await generateQueryEmbedding(query);
    
    // Fetch all memories (optionally filtered by session)
    let stmt;
    let memories;
    
    if (sessionId) {
      stmt = db.prepare('SELECT * FROM memory WHERE session_id = ?');
      memories = stmt.all(sessionId);
    } else {
      stmt = db.prepare('SELECT * FROM memory');
      memories = stmt.all();
    }

    if (memories.length === 0) {
      return [];
    }

    // Calculate similarity scores
    const memoriesWithScores = memories.map(memory => {
      const embedding = JSON.parse(memory.embedding);
      const similarity = cosineSimilarity(queryEmbedding, embedding);
      
      return {
        id: memory.id,
        sessionId: memory.session_id,
        text: memory.text,
        metadata: memory.metadata ? JSON.parse(memory.metadata) : {},
        created_at: memory.created_at,
        similarity
      };
    });

    // Sort by similarity and return top-k
    memoriesWithScores.sort((a, b) => b.similarity - a.similarity);
    return memoriesWithScores.slice(0, k);
  }

  /**
   * Get all memories for a session
   * @param {string} sessionId - Session identifier
   * @returns {Array} All memories for the session
   */
  static getBySession(sessionId) {
    const stmt = db.prepare('SELECT * FROM memory WHERE session_id = ? ORDER BY created_at DESC');
    const memories = stmt.all(sessionId);
    
    return memories.map(memory => ({
      id: memory.id,
      sessionId: memory.session_id,
      text: memory.text,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : {},
      created_at: memory.created_at
    }));
  }

  /**
   * Get all memories
   * @returns {Array} All memories
   */
  static getAll() {
    const stmt = db.prepare('SELECT * FROM memory ORDER BY created_at DESC');
    const memories = stmt.all();
    
    return memories.map(memory => ({
      id: memory.id,
      sessionId: memory.session_id,
      text: memory.text,
      metadata: memory.metadata ? JSON.parse(memory.metadata) : {},
      created_at: memory.created_at
    }));
  }

  /**
   * Delete a memory
   * @param {number} id - Memory ID
   */
  static delete(id) {
    const stmt = db.prepare('DELETE FROM memory WHERE id = ?');
    return stmt.run(id);
  }
}
