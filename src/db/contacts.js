import db from './schema.js';

export class ContactsDB {
  // Create a new contact
  static create({ name, email, vip = false, notes = '' }) {
    const stmt = db.prepare(`
      INSERT INTO contacts (name, email, vip, notes)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, email, vip ? 1 : 0, notes);
    return this.read(result.lastInsertRowid);
  }

  // Read contact(s)
  static read(id = null) {
    if (id !== null) {
      const stmt = db.prepare('SELECT * FROM contacts WHERE id = ?');
      return stmt.get(id);
    }
    
    const stmt = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC');
    return stmt.all();
  }

  // Read by email
  static readByEmail(email) {
    const stmt = db.prepare('SELECT * FROM contacts WHERE email = ?');
    return stmt.get(email);
  }

  // Search contacts
  static search({ name, email, vip }) {
    let query = 'SELECT * FROM contacts WHERE 1=1';
    const params = [];

    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }

    if (email) {
      query += ' AND email LIKE ?';
      params.push(`%${email}%`);
    }

    if (vip !== undefined) {
      query += ' AND vip = ?';
      params.push(vip ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params);
  }

  // Update a contact
  static update(id, updates) {
    const allowedFields = ['name', 'email', 'vip', 'notes'];
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = ?`);
        values.push(key === 'vip' ? (value ? 1 : 0) : value);
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);

    const query = `UPDATE contacts SET ${fields.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    stmt.run(...values);

    return this.read(id);
  }

  // Delete a contact
  static delete(id) {
    const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
    return stmt.run(id);
  }
}
