import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
const port = 5000;

// Essential middleware only
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

(async () => {
  try {
    const server = await registerRoutes(app);

    // Error handler
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Setup vite in development
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    server.listen({
      port,
      host: "0.0.0.0",
    }, () => {
      log(`serving on port ${port}`);
    });

  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
})();