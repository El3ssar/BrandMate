import express from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db/client.js";
import { loadSessionUser } from "../middleware/auth.js";

const router = express.Router();
const SALT_ROUNDS = 12;

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return rest;
}

router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Email inválido" });
    }
    if (!password || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 8 caracteres" });
    }

    const normalizedEmail = email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return res.status(409).json({ error: "El usuario ya existe" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash }
    });

    req.session.userId = Number(user.id);
    res.status(201).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Error en registro", err);
    res.status(500).json({ error: "No se pudo registrar" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Credenciales incompletas" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    req.session.userId = Number(user.id);
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("Error en login", err);
    res.status(500).json({ error: "No se pudo iniciar sesión" });
  }
});

router.post("/logout", (req, res) => {
  if (!req.session) {
    return res.status(200).json({ ok: true });
  }
  req.session.destroy((err) => {
    if (err) {
      console.error("Error al cerrar sesión", err);
      return res.status(500).json({ error: "No se pudo cerrar sesión" });
    }
    res.clearCookie("connect.sid", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production"
    });
    res.json({ ok: true });
  });
});

router.get("/me", loadSessionUser, async (req, res) => {
  if (!req.user) {
    return res.json({ user: null, workspaces: [] });
  }
  const workspaces = await prisma.workspace.findMany({
    where: { userId: req.user.id },
    orderBy: { updatedAt: "desc" }
  });
  res.json({ user: req.user, workspaces });
});

export default router;
