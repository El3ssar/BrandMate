import db from './database.js';
import { v4 as uuidv4 } from 'uuid';

export const auditDb = {
  create(sessionId, userId, auditResult, assetsCount) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO audit_history (id, session_id, user_id, audit_result, assets_count, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      sessionId,
      userId,
      JSON.stringify(auditResult),
      assetsCount,
      now
    );

    return this.findById(id);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM audit_history WHERE id = ?');
    const audit = stmt.get(id);
    if (!audit) return null;

    return this._mapAudit(audit);
  },

  findBySessionId(sessionId, limit = 50) {
    const stmt = db.prepare(`
      SELECT * FROM audit_history 
      WHERE session_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    const audits = stmt.all(sessionId, limit);
    return audits.map(a => this._mapAudit(a));
  },

  findByUserId(userId, limit = 100) {
    const stmt = db.prepare(`
      SELECT * FROM audit_history 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    const audits = stmt.all(userId, limit);
    return audits.map(a => this._mapAudit(a));
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM audit_history WHERE id = ?');
    stmt.run(id);
  },

  deleteBySessionId(sessionId) {
    const stmt = db.prepare('DELETE FROM audit_history WHERE session_id = ?');
    stmt.run(sessionId);
  },

  _mapAudit(audit) {
    return {
      id: audit.id,
      sessionId: audit.session_id,
      userId: audit.user_id,
      auditResult: JSON.parse(audit.audit_result),
      assetsCount: audit.assets_count,
      createdAt: audit.created_at
    };
  }
};

