import express from "express";
import { prisma } from "../db/client.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

function getUserId(req) {
  return Number(req.session.userId);
}

router.get("/", async (req, res) => {
  const userId = getUserId(req);
  const workspaces = await prisma.workspace.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" }
  });
  res.json({ workspaces });
});

router.get("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const workspace = await prisma.workspace.findFirst({
    where: { id, userId }
  });
  if (!workspace) {
    return res.status(404).json({ error: "Workspace no encontrado" });
  }
  res.json({ workspace });
});

router.post("/", async (req, res) => {
  const userId = getUserId(req);
  const { name, data } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Nombre requerido" });
  }
  const payload = typeof data === "object" && data !== null ? data : {};
  const workspace = await prisma.workspace.create({
    data: {
      name,
      data: payload,
      userId
    }
  });
  res.status(201).json({ workspace });
});

router.patch("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const existing = await prisma.workspace.findFirst({ where: { id, userId } });
  if (!existing) {
    return res.status(404).json({ error: "Workspace no encontrado" });
  }
  const { name, data } = req.body || {};
  const payload = typeof data === "object" && data !== null ? data : undefined;
  const workspace = await prisma.workspace.update({
    where: { id },
    data: {
      ...(typeof name === "string" ? { name } : {}),
      ...(typeof payload !== "undefined" ? { data: payload } : {})
    }
  });
  res.json({ workspace });
});

router.delete("/:id", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const existing = await prisma.workspace.findFirst({ where: { id, userId } });
  if (!existing) {
    return res.status(404).json({ error: "Workspace no encontrado" });
  }
  await prisma.workspace.delete({ where: { id } });
  res.status(204).send();
});

router.get("/:id/export", async (req, res) => {
  const userId = getUserId(req);
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const workspace = await prisma.workspace.findFirst({
    where: { id, userId }
  });
  if (!workspace) {
    return res.status(404).json({ error: "Workspace no encontrado" });
  }
  res.json({ name: workspace.name, data: workspace.data });
});

export default router;
