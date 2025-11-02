import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import { destillWithGemini, reviewWithGemini } from "./providers/gemini.js";
import { destillWithOpenAI, reviewWithOpenAI } from "./providers/openai.js";
import { destillWithGrok, reviewWithGrok } from "./providers/grok.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Static
app.use(express.static(path.join(__dirname, "..", "public")));

function pickProvider(name) {
  const p = (name || "").toLowerCase();
  if (p === "openai" || p === "chatgpt") return "openai";
  if (p === "grok" || p === "xai") return "grok";
  return "gemini";
}

// --- DESTILL ---
app.post("/api/destill", async (req, res) => {
  try {
    const { provider, labelDescription, images } = req.body;
    const chosen = pickProvider(provider);

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "No se enviaron imágenes de contexto." });
    }

    let resultText;
    if (chosen === "openai") {
      resultText = await destillWithOpenAI({ labelDescription, images });
    } else if (chosen === "grok") {
      resultText = await destillWithGrok({ labelDescription, images });
    } else {
      resultText = await destillWithGemini({ labelDescription, images });
    }

    res.json({ ok: true, text: resultText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

// --- REVIEW ---
app.post("/api/review", async (req, res) => {
  try {
    const {
      provider,
      brandGuidelines,
      visualAnalysis,
      labelDescription,
      reviewQuery,
      assets
    } = req.body;

    const chosen = pickProvider(provider);

    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: "No se enviaron assets a revisar." });
    }

    let resultJSON;
    if (chosen === "openai") {
      resultJSON = await reviewWithOpenAI({
        brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets
      });
    } else if (chosen === "grok") {
      resultJSON = await reviewWithGrok({
        brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets
      });
    } else {
      resultJSON = await reviewWithGemini({
        brandGuidelines, visualAnalysis, labelDescription, reviewQuery, assets
      });
    }

    res.json({ ok: true, json: resultJSON });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err.message || err) });
  }
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`Brand Guardian corriendo en http://localhost:${PORT}`);
});
