import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { initializeDatabase } from "./db/database.js";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import auditRoutes from "./routes/audits.js";
import { authMiddleware, optionalAuth } from "./middleware/auth.js";

import { destillWithGemini, reviewWithGemini } from "./providers/gemini.js";
import { destillWithOpenAI, reviewWithOpenAI } from "./providers/openai.js";
import { destillWithGrok, reviewWithGrok } from "./providers/grok.js";
import { auditDb } from "./db/audits.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
initializeDatabase();

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/audits", auditRoutes);

function pickProvider(name) {
  const p = (name || "").toLowerCase();
  if (p === "openai" || p === "chatgpt") return "openai";
  if (p === "grok" || p === "xai") return "grok";
  return "gemini";
}

// --- DISTILL ---
app.post("/api/destill", async (req, res) => {
  try {
    const { provider, labelDescription, images } = req.body;
    const chosen = pickProvider(provider);

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No se enviaron archivos de contexto." });
    }

    console.log(`Processing ${images.length} files for distill with ${chosen}...`);

    let resultText;
    
    if (chosen === "gemini") {
      // Gemini supports PDFs natively - send all files as-is
      console.log(`Gemini: Sending ${images.length} files directly (native PDF support)`);
      resultText = await destillWithGemini({ labelDescription, files: images });
    } else {
      // OpenAI and Grok: For now, filter out PDFs and only use images
      // TODO: Implement proper PDF text extraction when library compatibility is resolved
      const onlyImages = images.filter(f => f.mimeType && f.mimeType.startsWith('image/'));
      console.log(`${chosen}: Using ${onlyImages.length} images (PDFs filtered out - use Gemini for PDF support)`);
      
      if (onlyImages.length === 0) {
        return res.status(400).json({ 
          error: "OpenAI and Grok currently only support images. Please use Gemini provider for PDF support, or upload only images." 
        });
      }

      if (chosen === "openai") {
        resultText = await destillWithOpenAI({ labelDescription, images: onlyImages, pdfTexts: [] });
      } else {
        resultText = await destillWithGrok({ labelDescription, images: onlyImages, pdfTexts: [] });
      }
    }

    res.json({ ok: true, text: resultText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// --- REVIEW ---
app.post("/api/review", optionalAuth, async (req, res) => {
  try {
    const {
      provider,
      brandGuidelines,
      visualAnalysis,
      labelDescription,
      reviewQuery,
      assets,
      visualContext = []  // ALL visual references (PDF, examples, labels)
    } = req.body;

    const chosen = pickProvider(provider);

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: "No se enviaron assets a revisar." });
    }

    console.log(`Processing ${assets.length} assets for review with ${chosen}...`);
    console.log(`Visual context files: ${visualContext.length}`);

    let resultJSON;
    
    // Filter to only images for assets being reviewed
    const onlyImages = assets.filter(f => f.mimeType && f.mimeType.startsWith('image/'));
    console.log(`${chosen}: Reviewing ${onlyImages.length} asset images`);

    if (onlyImages.length === 0) {
      return res.status(400).json({ 
        error: "Please upload image assets to review (JPG, PNG, etc.)" 
      });
    }

    if (chosen === "gemini") {
      // Gemini: Send assets + ALL visual context (PDF, examples, labels)
      resultJSON = await reviewWithGemini({
        brandGuidelines, 
        visualAnalysis, 
        labelDescription, 
        reviewQuery, 
        assets: onlyImages,
        visualContext  // Full visual references
      });
    } else if (chosen === "openai") {
      // OpenAI: Filter visual context to images only (no PDFs)
      const contextImages = visualContext.filter(f => f.mimeType && f.mimeType.startsWith('image/'));
      resultJSON = await reviewWithOpenAI({
        brandGuidelines, 
        visualAnalysis, 
        labelDescription, 
        reviewQuery, 
        assets: onlyImages,
        visualContext: contextImages
      });
    } else {
      // Grok: Filter visual context to images only (no PDFs)
      const contextImages = visualContext.filter(f => f.mimeType && f.mimeType.startsWith('image/'));
      resultJSON = await reviewWithGrok({
        brandGuidelines, 
        visualAnalysis, 
        labelDescription, 
        reviewQuery, 
        assets: onlyImages,
        visualContext: contextImages
      });
    }

    // Save audit to history if user is authenticated and sessionId provided
    if (req.user && req.body.sessionId) {
      try {
        auditDb.create(req.body.sessionId, req.user.id, resultJSON, assets.length);
        console.log(`✓ Audit saved to history for session ${req.body.sessionId}`);
      } catch (auditError) {
        console.error('Failed to save audit history:', auditError);
        // Don't fail the request if history save fails
      }
    }

    res.json({ ok: true, json: resultJSON });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Brand Guardian API is running" });
});

// Static files for production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "..", "dist")));
  
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });
}

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`✓ Brand Guardian server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

