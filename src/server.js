import 'dotenv/config';
import express from 'express';
import chatRoutes from './routes/chat.js';
import contactsRoutes from './routes/contacts.js';
import memoryRoutes from './routes/memory.js';

// Initialize database schema
import './db/schema.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/chat', chatRoutes);
app.use('/contacts', contactsRoutes);
app.use('/memory', memoryRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Agentic Chat with Long-Term Memory',
    version: '1.0.0',
    endpoints: {
      chat: 'POST /chat',
      contacts: {
        list: 'GET /contacts',
        get: 'GET /contacts/:id',
        create: 'POST /contacts',
        update: 'PATCH /contacts/:id',
        delete: 'DELETE /contacts/:id'
      },
      memory: {
        search: 'GET /memory/search?q=query&k=5',
        list: 'GET /memory',
        create: 'POST /memory',
        delete: 'DELETE /memory/:id'
      }
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}`);
  console.log(`\nEndpoints:`);
  console.log(`  POST   http://localhost:${PORT}/chat`);
  console.log(`  GET    http://localhost:${PORT}/contacts`);
  console.log(`  GET    http://localhost:${PORT}/memory/search?q=query`);
  console.log(`\nReady to chat!\n`);
});

export default app;
