import pino from "pino";
import { env } from "../config/env.js";

export const logger = pino({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "password",
      "passwordHash",
      "token",
      "capiToken",
      "accessTokenEnc",
      "*.password",
      "*.token",
      "cpf",
      "document",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
    remove: true,
  },
  transport:
    env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});
