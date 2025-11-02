import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import { fileURLToPath } from "url";

import { destillWithGemini, reviewWithGemini } from "./providers/gemini.js";
import { destillWithOpenAI, reviewWithOpenAI } from "./providers/openai.js";
import { destillWithGrok, reviewWithGrok } from "./providers/grok.js";
import authRouter from "./routes/auth.js";
import workspaceRouter from "./routes/workspaces.js";
import { loadSessionUser, requireAuth } from "./middleware/auth.js";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbDir = path.join(__dirname, "db");

fs.mkdirSync(dbDir, { recursive: true });

const SQLiteStore = SQLiteStoreFactory(session);
const isProduction = process.env.NODE_ENV === "production";
const sessionSecret = process.env.SESSION_SECRET || "insecure-session-secret";
const allowedOrigins = process.env.CLIENT_ORIGIN?.split(",").map(o => o.trim()).filter(Boolean);

if (!process.env.SESSION_SECRET) {
  console.warn("SESSION_SECRET no configurado. Usa un valor seguro en producción.");
}

app.use(cors({
  origin: allowedOrigins && allowedOrigins.length ? allowedOrigins : true,
  credentials: true
}));
app.use(express.json({ limit: "20mb" }));
app.use(session({
  store: new SQLiteStore({
    db: "sessions.sqlite",
    dir: dbDir
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));
app.use(loadSessionUser);

// Static
app.use(express.static(path.join(__dirname, "..", "public")));

app.use("/api/auth", authRouter);
app.use("/api/workspaces", workspaceRouter);

function pickProvider(name) {
  const p = (name || "").toLowerCase();
  if (p === "openai" || p === "chatgpt") return "openai";
  if (p === "grok" || p === "xai") return "grok";
  return "gemini";
}

// --- DESTILL ---
app.post("/api/destill", requireAuth, async (req, res) => {
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
app.post("/api/review", requireAuth, async (req, res) => {
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
