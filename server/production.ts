import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import path from "path";
import fs from "fs";

const app = express();
const port = process.env.PORT || 5000;

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit", 
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

export function serveStatic(app: express.Express) {
  const distPath = path.resolve(process.cwd(), "dist/public");
  
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Fallback handler for client-side routing
  app.get("*", (_req, res) => {
    const indexPath = path.join(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found");
    }
  });
}

// Essential middleware only - increased limits for image uploads
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

(async () => {
  try {
    // Add request logging middleware to debug routing issues
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        console.log(`🌐 API Request: ${req.method} ${req.originalUrl} from ${req.get('User-Agent')?.substring(0, 50)}...`);
      }
      next();
    });

    // Register API routes first, before static middleware
    console.log('Registering API routes...');
    const server = await registerRoutes(app);
    console.log('API routes registered successfully');

    // Serve static files in production
    serveStatic(app);

    // Error handler (should be last)
    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      console.error('Error:', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

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