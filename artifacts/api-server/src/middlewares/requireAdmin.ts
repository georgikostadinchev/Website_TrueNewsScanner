import { type Request, type Response, type NextFunction } from "express";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "UNAUTHORIZED", message: "Необходима е идентификация" });
    return;
  }

  const owner = process.env.REPL_OWNER;
  if (!owner || req.replUsername !== owner) {
    res.status(403).json({ error: "FORBIDDEN", message: "Нямате достъп до тази страница" });
    return;
  }

  next();
}
