import express, { Request, Response, NextFunction } from "express";
import http from "node:http";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./services/prisma.js";
import path from "node:path";
import fs from "node:fs";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { trackingRoutes } from "./modules/tracking/tracking.routes.js";
import { webhookRoutes } from "./modules/tracking/webhooks/webhook.routes.js";
import { apiRoutes } from "./routes/api.routes.js";
import { authUserMiddleware } from "./middlewares/rbacMiddleware.js";

// Global BigInt JSON serialization support
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

const app = express();
const server = http.createServer(app);

// Realtime Socket.IO configuration
export const io = new SocketIOServer(server, {
  cors: {
    origin: [env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "Client connected to realtime socket");

  socket.on("join:client", (clientId: string) => {
    socket.join(`client:${clientId}`);
    logger.debug({ socketId: socket.id, clientId }, "Socket joined client room");
  });

  socket.on("join:org", (orgId: string) => {
    socket.join(`org:${orgId}`);
    logger.debug({ socketId: socket.id, orgId }, "Socket joined org room");
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "Client disconnected from socket");
  });
});

// Middleware stack
app.use(
  helmet({
    contentSecurityPolicy: false, // Customized in production or per-route
  })
);

app.use(
  cors({
    origin: [env.FRONTEND_URL, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-User-Role"],
  })
);

app.use(cookieParser(env.COOKIE_SECRET));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(authUserMiddleware);

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path !== "/health") {
      logger.info(
        {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: duration,
        },
        "HTTP Request"
      );
    }
  });
  next();
});

// Health check endpoint
app.get("/health", async (_req: Request, res: Response) => {
  let dbStatus = "mock_mode";
  let dbLatency = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = "connected";
  } catch (e: any) {
    dbStatus = "mock_planned";
  }

  res.json({
    status: "healthy",
    service: "gfb-growth-os-backend",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatency,
      note: "Banco de dados planejado com schema Prisma e mock data store ativo",
    },
    memory: {
      rssMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsedMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    },
  });
});

// API Routes
app.get("/api/auth/me", (req: Request, res: Response) => {
  res.json({ user: req.user });
});
app.use("/api/auth", authRoutes);
app.use(trackingRoutes);
app.use(webhookRoutes);
app.use(apiRoutes);

// Static frontend serving fallback (both ports 3000 and 3001 work seamlessly)
const frontendDist = path.resolve(process.cwd(), "../frontend/dist");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (
      req.path.startsWith("/api") ||
      req.path.startsWith("/s") ||
      req.path.startsWith("/l") ||
      req.path === "/health"
    ) {
      return next();
    }
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Global Error Handler
app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
  logger.error(
    {
      err: err.message,
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
      path: req.path,
      method: req.method,
    },
    "Unhandled Exception"
  );

  res.status(err.status || 500).json({
    error: env.NODE_ENV === "production" ? "Internal server error" : err.message,
    code: err.code || "INTERNAL_SERVER_ERROR",
  });
});

// Server boot
const PORT = env.PORT || 3001;
server.listen(PORT, () => {
  logger.info(`🚀 GFB Growth OS Backend running on port ${PORT} [${env.NODE_ENV}]`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});
