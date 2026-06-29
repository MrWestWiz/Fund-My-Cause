import type { Express, Request, Response, NextFunction } from "express";

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

  // CORS — internal service; only enabled if CORS_ORIGIN is explicitly set
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    const allowed = corsOrigin.split(",").map((o) => o.trim());
    app.use((req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      if (origin && allowed.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      }
      if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      next();
    });
  }

  // Input sanitisation: strip query params > 200 chars, reject body > 1mb
  app.use((req: Request, res: Response, next: NextFunction) => {
    for (const key of Object.keys(req.query)) {
      const val = req.query[key];
      if (typeof val === "string" && val.length > 200) {
        delete req.query[key];
      }
    }

    const contentLength = parseInt(req.headers["content-length"] ?? "0", 10);
    if (contentLength > 1_048_576) {
      res.status(413).json({ error: "Request body too large" });
      return;
    }
    next();
  });

  // Request logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    process.stdout.write(
      JSON.stringify({ time: new Date().toISOString(), method: req.method, url: req.url }) + "\n"
    );
    next();
  });
}
