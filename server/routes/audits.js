import express from 'express';
import { auditDb } from '../db/audits.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all audits for a session
router.get('/session/:sessionId', authMiddleware, (req, res) => {
  try {
    const audits = auditDb.findBySessionId(req.params.sessionId);
    res.json({
      ok: true,
      data: audits
    });
  } catch (error) {
    console.error('Get session audits error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific audit
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const audit = auditDb.findById(req.params.id);
    
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    res.json({
      ok: true,
      data: audit
    });
  } catch (error) {
    console.error('Get audit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete an audit
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const audit = auditDb.findById(req.params.id);
    
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (audit.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    auditDb.delete(req.params.id);
    
    res.json({
      ok: true,
      data: { message: 'Audit deleted successfully' }
    });
  } catch (error) {
    console.error('Delete audit error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

