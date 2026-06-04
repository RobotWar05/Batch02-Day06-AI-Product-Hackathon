import dotenv from "dotenv";
import express, { type Request, type Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

async function proxyToBackend(req: Request, res: Response) {
  try {
    const targetUrl = new URL(req.originalUrl.replace(/^\/backend/, ""), BACKEND_URL);
    const body =
      req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(req.body ?? {});

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
      body,
    });

    const contentType = response.headers.get("content-type");
    const responseText = await response.text();

    if (contentType) {
      res.setHeader("content-type", contentType);
    }

    res.status(response.status).send(responseText);
  } catch (error) {
    console.error("Backend proxy error:", error);
    res.status(502).json({
      detail: "Cannot reach FastAPI backend.",
      backend_url: BACKEND_URL,
    });
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use("/backend", proxyToBackend);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Demo Nemo runs on http://0.0.0.0:${PORT}`);
    console.log(`Proxying backend requests to ${BACKEND_URL}`);
  });
}

startServer();
