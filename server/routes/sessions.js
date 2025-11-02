import express from 'express';
import { sessionDb } from '../db/sessions.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Get all sessions for current user
router.get('/', authMiddleware, (req, res) => {
  try {
    const sessions = sessionDb.findByUserId(req.user.id);
    res.json({
      ok: true,
      data: sessions
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific session
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const session = sessionDb.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      ok: true,
      data: session
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new session
router.post('/', authMiddleware, (req, res) => {
  try {
    const sessionData = req.body;
    
    if (!sessionData.name) {
      return res.status(400).json({ error: 'Session name is required' });
    }

    const session = sessionDb.create(req.user.id, sessionData);
    
    res.json({
      ok: true,
      data: session
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a session
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const session = sessionDb.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedSession = sessionDb.update(req.params.id, req.body);
    
    res.json({
      ok: true,
      data: updatedSession
    });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a session
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const session = sessionDb.findById(req.params.id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    sessionDb.delete(req.params.id);
    
    res.json({
      ok: true,
      data: { message: 'Session deleted successfully' }
    });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export sessions
router.get('/export/all', authMiddleware, (req, res) => {
  try {
    const sessions = sessionDb.findByUserId(req.user.id);
    
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      user: {
        username: req.user.username,
        displayName: req.user.displayName
      },
      sessions
    };

    res.json({
      ok: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import sessions
router.post('/import', authMiddleware, (req, res) => {
  try {
    const { sessions } = req.body;

    if (!Array.isArray(sessions)) {
      return res.status(400).json({ error: 'Invalid import data' });
    }

    const importedSessions = [];

    for (const sessionData of sessions) {
      // Remove IDs to create new sessions
      const { id, userId, createdAt, updatedAt, ...data } = sessionData;
      const newSession = sessionDb.create(req.user.id, data);
      importedSessions.push(newSession);
    }

    res.json({
      ok: true,
      data: {
        message: `Successfully imported ${importedSessions.length} sessions`,
        sessions: importedSessions
      }
    });
  } catch (error) {
    console.error('Import sessions error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;


