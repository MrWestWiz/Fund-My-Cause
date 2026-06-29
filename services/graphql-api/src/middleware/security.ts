import type { Express, Request, Response, NextFunction } from "express";
import express from "express";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "0",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'",
};

export function applySecurityMiddleware(app: Express): void {
  // Security headers
  app.use((_req: Request, res: Response, next: NextFunction) => {
    for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
      res.setHeader(header, value);
    }
    next();
  });

  // Content-Type validation for POST requests on non-GraphQL routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === "POST" && !req.path.startsWith("/graphql")) {
      const ct = req.headers["content-type"] ?? "";
      if (!ct.startsWith("application/json")) {
        res.status(415).json({ error: "Unsupported Media Type" });
        return;
      }
    }
    next();
  });

  // Body size limit (100kb) for non-GraphQL routes
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/graphql")) {
      next();
      return;
    }
    express.json({ limit: "100kb" })(req, res, next);
  });
}
