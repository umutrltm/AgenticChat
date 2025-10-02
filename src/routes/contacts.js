import express from 'express';
import { ContactsDB } from '../db/contacts.js';

const router = express.Router();

/**
 * GET /contacts
 * List all contacts
 */
router.get('/', (req, res) => {
  try {
    const contacts = ContactsDB.read();
    res.json({ contacts });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /contacts/:id
 * Get a specific contact
 */
router.get('/:id', (req, res) => {
  try {
    const contact = ContactsDB.read(parseInt(req.params.id));
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ contact });
  } catch (error) {
    console.error('Error fetching contact:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /contacts
 * Create a new contact
 */
router.post('/', (req, res) => {
  try {
    const { name, email, vip = false, notes = '' } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const contact = ContactsDB.create({ name, email, vip, notes });
    res.status(201).json({ contact });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /contacts/:id
 * Update a contact
 */
router.patch('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const updates = req.body;

    const contact = ContactsDB.update(id, updates);
    res.json({ contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /contacts/:id
 * Delete a contact
 */
router.delete('/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    ContactsDB.delete(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
