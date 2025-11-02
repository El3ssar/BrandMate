import db from './database.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export const userDb = {
  create(data) {
    const id = uuidv4();
    const passwordHash = bcrypt.hashSync(data.password, 10);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (id, username, email, password_hash, display_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(id, data.username, data.email, passwordHash, data.displayName, now, now);

    return this.findById(id);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = stmt.get(id);
    if (!user) return null;
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.display_name,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };
  },

  findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password_hash);
  },

  update(id, data) {
    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    if (data.displayName) {
      updates.push('display_name = ?');
      values.push(data.displayName);
    }
    if (data.email) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.password) {
      updates.push('password_hash = ?');
      values.push(bcrypt.hashSync(data.password, 10));
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(id);
  }
};


