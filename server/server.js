import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { initializeDatabase } from "./db/database.js";
import authRoutes from "./routes/auth.js";
import sessionRoutes from "./routes/sessions.js";
import auditRoutes from "./routes/audits.js";
import { optionalAuth } from "./middleware/auth.js";
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

initializeDatabase();

app.use("/api/auth", authRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/audits", auditRoutes);

function pickProvider(name) {
  const p = (name || "").toLowerCase();
  if (p === "openai" || p === "chatgpt") return "openai";
  if (p === "grok" || p === "xai") return "grok";
  return "gemini";
}

app.post("/api/destill", async (req, res) => {
  try {
    const { provider, labelDescription, images, stream = false } = req.body;
    const chosen = pickProvider(provider);

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      if (chosen === "gemini") {
        const { destillWithGeminiStream } = await import("./providers/gemini.js");
        await destillWithGeminiStream({ labelDescription, files: images }, (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });
      } else {
        const onlyImages = images.filter(f => f.mimeType?.startsWith('image/'));
        if (onlyImages.length === 0) {
          res.write(`data: ${JSON.stringify({ error: "Use Gemini for PDF support" })}\n\n`);
          res.end();
          return;
        }

        const streamFn = chosen === "openai" 
          ? (await import("./providers/openai.js")).destillWithOpenAIStream
          : (await import("./providers/grok.js")).destillWithGrokStream;
        
        await streamFn({ labelDescription, images: onlyImages }, (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });
      }

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } else {
      let resultText;
      
      if (chosen === "gemini") {
        resultText = await destillWithGemini({ labelDescription, files: images });
      } else {
        const onlyImages = images.filter(f => f.mimeType?.startsWith('image/'));
        if (onlyImages.length === 0) {
          return res.status(400).json({ error: "Use Gemini for PDF support or upload only images" });
        }

        resultText = chosen === "openai"
          ? await destillWithOpenAI({ labelDescription, images: onlyImages, pdfTexts: [] })
          : await destillWithGrok({ labelDescription, images: onlyImages, pdfTexts: [] });
      }

      res.json({ ok: true, text: resultText });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.post("/api/review", optionalAuth, async (req, res) => {
  try {
    const { provider, brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets, visualContext = [] } = req.body;
    const chosen = pickProvider(provider);

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: "No assets provided" });
    }

    const onlyImages = assets.filter(f => f.mimeType?.startsWith('image/'));
    if (onlyImages.length === 0) {
      return res.status(400).json({ error: "Please upload image assets" });
    }

    const contextImages = chosen === "gemini" 
      ? visualContext 
      : visualContext.filter(f => f.mimeType?.startsWith('image/'));

    const resultJSON = chosen === "gemini"
      ? await reviewWithGemini({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets: onlyImages, visualContext: contextImages })
      : chosen === "openai"
      ? await reviewWithOpenAI({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets: onlyImages, visualContext: contextImages })
      : await reviewWithGrok({ brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets: onlyImages, visualContext: contextImages });

    if (req.user && req.body.sessionId) {
      try {
        const auditWithAssets = { ...resultJSON, _assetFiles: onlyImages };
        auditDb.create(req.body.sessionId, req.user.id, auditWithAssets, onlyImages.length);
      } catch (auditError) {
        console.error('Failed to save audit:', auditError);
      }
    }

    res.json({ ok: true, json: { ...resultJSON, _assetFiles: onlyImages } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, message: "Brand Guardian API is running" });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, "..", "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
  });
}

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`✓ Brand Guardian running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

