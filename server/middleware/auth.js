import { prisma } from "../db/client.js";

export async function loadSessionUser(req, res, next) {
  try {
    const rawId = req.session?.userId;
    const userId = Number(rawId);
    if (!rawId || !Number.isInteger(userId)) {
      req.user = null;
      return next();
    }
    if (req.user) return next();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, createdAt: true }
    });
    req.user = user || null;
    if (!user) {
      req.session.destroy(() => {});
    } else {
      req.session.userId = user.id;
    }
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAuth(req, res, next) {
  const userId = Number(req.session?.userId);
  if (Number.isInteger(userId)) {
    return next();
  }
  return res.status(401).json({ error: "Autenticación requerida" });
}
