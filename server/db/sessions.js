import db from './database.js';
import { v4 as uuidv4 } from 'uuid';

export const sessionDb = {
  create(userId, data) {
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO brand_sessions (
        id, user_id, name, description, provider,
        brand_colors, text_guidelines, label_description, visual_analysis,
        design_system_pdf, few_shot_images, correct_label_images, incorrect_label_images,
        custom_distill_prompt, custom_review_prompt, ai_parameters,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      data.name,
      data.description || '',
      data.provider || 'gemini',
      JSON.stringify(data.brandColors || []),
      data.textGuidelines || '',
      data.labelDescription || '',
      data.visualAnalysis || '',
      JSON.stringify(data.designSystemPdf || []),
      JSON.stringify(data.fewShotImages || []),
      JSON.stringify(data.correctLabelImages || []),
      JSON.stringify(data.incorrectLabelImages || []),
      data.customDistillPrompt || '',
      data.customReviewPrompt || '',
      JSON.stringify(data.aiParameters || {}),
      now,
      now
    );

    return this.findById(id);
  },

  findById(id) {
    const stmt = db.prepare('SELECT * FROM brand_sessions WHERE id = ?');
    const session = stmt.get(id);
    if (!session) return null;

    return this._mapSession(session);
  },

  findByUserId(userId) {
    const stmt = db.prepare('SELECT * FROM brand_sessions WHERE user_id = ? ORDER BY updated_at DESC');
    const sessions = stmt.all(userId);
    return sessions.map(s => this._mapSession(s));
  },

  update(id, data) {
    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }
    if (data.provider !== undefined) {
      updates.push('provider = ?');
      values.push(data.provider);
    }
    if (data.brandColors !== undefined) {
      updates.push('brand_colors = ?');
      values.push(JSON.stringify(data.brandColors));
    }
    if (data.textGuidelines !== undefined) {
      updates.push('text_guidelines = ?');
      values.push(data.textGuidelines);
    }
    if (data.labelDescription !== undefined) {
      updates.push('label_description = ?');
      values.push(data.labelDescription);
    }
    if (data.visualAnalysis !== undefined) {
      updates.push('visual_analysis = ?');
      values.push(data.visualAnalysis);
    }
    if (data.designSystemPdf !== undefined) {
      updates.push('design_system_pdf = ?');
      values.push(JSON.stringify(data.designSystemPdf));
    }
    if (data.fewShotImages !== undefined) {
      updates.push('few_shot_images = ?');
      values.push(JSON.stringify(data.fewShotImages));
    }
    if (data.correctLabelImages !== undefined) {
      updates.push('correct_label_images = ?');
      values.push(JSON.stringify(data.correctLabelImages));
    }
    if (data.incorrectLabelImages !== undefined) {
      updates.push('incorrect_label_images = ?');
      values.push(JSON.stringify(data.incorrectLabelImages));
    }
    if (data.customDistillPrompt !== undefined) {
      updates.push('custom_distill_prompt = ?');
      values.push(data.customDistillPrompt);
    }
    if (data.customReviewPrompt !== undefined) {
      updates.push('custom_review_prompt = ?');
      values.push(data.customReviewPrompt);
    }
    if (data.aiParameters !== undefined) {
      updates.push('ai_parameters = ?');
      values.push(JSON.stringify(data.aiParameters));
    }

    if (updates.length === 0) return this.findById(id);

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    const stmt = db.prepare(`
      UPDATE brand_sessions SET ${updates.join(', ')} WHERE id = ?
    `);

    stmt.run(...values);
    return this.findById(id);
  },

  delete(id) {
    const stmt = db.prepare('DELETE FROM brand_sessions WHERE id = ?');
    stmt.run(id);
  },

  _mapSession(session) {
    // Safe JSON parsing with fallbacks
    const safeParse = (str, fallback) => {
      try {
        return JSON.parse(str || fallback);
      } catch (e) {
        console.warn('JSON parse error, using fallback:', e.message);
        return fallback;
      }
    };

    return {
      id: session.id,
      userId: session.user_id,
      name: session.name,
      description: session.description,
      provider: session.provider,
      brandColors: safeParse(session.brand_colors, '[]'),
      textGuidelines: session.text_guidelines || '',
      labelDescription: session.label_description || '',
      visualAnalysis: session.visual_analysis || '',
      designSystemPdf: safeParse(session.design_system_pdf, '[]'),
      fewShotImages: safeParse(session.few_shot_images, '[]'),
      correctLabelImages: safeParse(session.correct_label_images, '[]'),
      incorrectLabelImages: safeParse(session.incorrect_label_images, '[]'),
      customDistillPrompt: session.custom_distill_prompt || '',
      customReviewPrompt: session.custom_review_prompt || '',
      aiParameters: safeParse(session.ai_parameters, '{}'),
      createdAt: session.created_at,
      updatedAt: session.updated_at
    };
  }
};


