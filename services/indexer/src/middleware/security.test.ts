import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { applySecurityMiddleware } from "./security.js";

function makeReqRes(overrides: {
  method?: string;
  url?: string;
  query?: Record<string, string>;
  headers?: Record<string, string>;
}) {
  const headers: Record<string, string> = overrides.headers ?? {};
  const req = {
    method: overrides.method ?? "GET",
    url: overrides.url ?? "/",
    query: overrides.query ?? {},
    headers,
  } as unknown as Request;

  const setHeaders: Record<string, string> = {};
  let statusCode = 200;
  let sentBody: unknown;

  const res = {
    setHeader: (name: string, value: string) => {
      setHeaders[name] = value;
    },
    getHeaders: () => setHeaders,
    status: (code: number) => {
      statusCode = code;
      return res;
    },
    json: (body: unknown) => {
      sentBody = body;
    },
    sendStatus: (code: number) => {
      statusCode = code;
    },
    get statusCode() {
      return statusCode;
    },
    get body() {
      return sentBody;
    },
  } as unknown as Response & { getHeaders(): Record<string, string>; statusCode: number; body: unknown };

  return { req, res, setHeaders, getStatus: () => statusCode, getBody: () => sentBody };
}

/** Run only the first middleware registered on the app's stack. */
function runMiddleware(
  app: Express,
  req: Request,
  res: Response,
): Promise<"next" | "done"> {
  return new Promise((resolve) => {
    // Walk the app's router stack and run all non-route middleware in sequence
    const layers = (app._router?.stack ?? []) as Array<{
      route?: unknown;
      handle: (req: Request, res: Response, next: NextFunction) => void;
    }>;
    let idx = 0;
    function next() {
      const layer = layers[idx++];
      if (!layer) { resolve("next"); return; }
      if (layer.route) { next(); return; }
      layer.handle(req, res, next as NextFunction);
    }
    // Patch res.json / res.sendStatus to resolve "done"
    const origJson = (res as any).json.bind(res);
    (res as any).json = (body: unknown) => { origJson(body); resolve("done"); };
    const origSendStatus = (res as any).sendStatus.bind(res);
    (res as any).sendStatus = (code: number) => { origSendStatus(code); resolve("done"); };
    next();
  });
}

describe("applySecurityMiddleware (indexer)", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    delete process.env.CORS_ORIGIN;
    applySecurityMiddleware(app);
    // Add a simple catch-all route so middleware can run
    app.use((_req, res) => res.sendStatus(200));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sets all security headers on a normal request", async () => {
    const { req, res, setHeaders } = makeReqRes({});
    await runMiddleware(app, req, res);

    expect(setHeaders["X-Content-Type-Options"]).toBe("nosniff");
    expect(setHeaders["X-Frame-Options"]).toBe("DENY");
    expect(setHeaders["X-XSS-Protection"]).toBe("0");
    expect(setHeaders["Referrer-Policy"]).toBe("no-referrer");
    expect(setHeaders["Content-Security-Policy"]).toBe("default-src 'none'");
  });

  it("rejects requests with Content-Length > 1mb with 413", async () => {
    const { req, res, getStatus, getBody } = makeReqRes({
      headers: { "content-length": String(1_048_577) },
    });
    await runMiddleware(app, req, res);

    expect(getStatus()).toBe(413);
    expect((getBody() as any)?.error).toMatch(/too large/i);
  });

  it("does not reject requests within size limit", async () => {
    const { req, res, getStatus } = makeReqRes({
      headers: { "content-length": "512" },
    });
    await runMiddleware(app, req, res);
    expect(getStatus()).not.toBe(413);
  });

  it("strips query params longer than 200 chars", async () => {
    const longVal = "a".repeat(201);
    const { req, res } = makeReqRes({ query: { search: longVal, ok: "short" } });
    await runMiddleware(app, req, res);

    expect((req.query as any).search).toBeUndefined();
    expect((req.query as any).ok).toBe("short");
  });

  it("does not add CORS headers when CORS_ORIGIN is unset", async () => {
    const { req, res, setHeaders } = makeReqRes({});
    await runMiddleware(app, req, res);
    expect(setHeaders["Access-Control-Allow-Origin"]).toBeUndefined();
  });

  it("adds CORS header when origin matches CORS_ORIGIN", async () => {
    process.env.CORS_ORIGIN = "https://example.com";
    const corsApp = express();
    applySecurityMiddleware(corsApp);
    corsApp.use((_req, res) => res.sendStatus(200));

    const { req, res, setHeaders } = makeReqRes({
      headers: { origin: "https://example.com" },
    });
    await runMiddleware(corsApp, req, res);
    expect(setHeaders["Access-Control-Allow-Origin"]).toBe("https://example.com");
    delete process.env.CORS_ORIGIN;
  });
});
