import express from 'express';
import { processChat } from '../agent/chat.js';

const router = express.Router();

/**
 * POST /chat
 * Main chat endpoint for agent interactions
 */
router.post('/', async (req, res) => {
  try {
    const { message, sessionId = 'default' } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Message is required'
      });
    }

    const result = await processChat(message, sessionId);

    res.json(result);
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;
