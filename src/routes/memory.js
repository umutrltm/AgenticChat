import express from 'express';
import { MemoryDB } from '../db/memory.js';

const router = express.Router();

/**
 * GET /memory/search
 * Semantic search in memory
 */
router.get('/search', async (req, res) => {
  try {
    const { q, k = 5, sessionId } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await MemoryDB.recall(q, parseInt(k), sessionId || null);
    res.json({ results });
  } catch (error) {
    console.error('Error searching memory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /memory
 * List all memories or filter by session
 */
router.get('/', (req, res) => {
  try {
    const { sessionId } = req.query;

    const memories = sessionId 
      ? MemoryDB.getBySession(sessionId)
      : MemoryDB.getAll();

    res.json({ memories });
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /memory
 * Manually add a memory
 */
router.post('/', async (req, res) => {
  try {
    const { text, sessionId, metadata } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const memory = await MemoryDB.remember(text, sessionId || null, metadata || null);
    res.status(201).json({ memory });
  } catch (error) {
    console.error('Error creating memory:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /memory/:id
 * Delete a memory
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    MemoryDB.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting memory:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
