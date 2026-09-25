import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    log:
      env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

if (env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

// Log slow queries or errors in development
if (env.NODE_ENV === "development") {
  // @ts-expect-error Prisma event typing
  prisma.$on("query", (e: { query: string; duration: number }) => {
    if (e.duration > 100) {
      logger.warn({ duration: e.duration, query: e.query }, "Slow database query detected");
    }
  });
}
