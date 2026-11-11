import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { prisma } from "../services/prisma.js";
import { UserRole } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  growthRole?: string;
  organizationId?: string;
  clientId?: string;
  clientName?: string;
  clientSlug?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined = req.cookies?.access_token;

    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      sub: string;
      email: string;
      role: UserRole;
      organizationId?: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        memberships: {
          take: 1,
          select: { organizationId: true, role: true },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "User account inactive or not found", code: "USER_INACTIVE" });
      return;
    }

    const primaryMembership = user.memberships[0];

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: primaryMembership?.role ?? UserRole.CLIENT,
      organizationId: primaryMembership?.organizationId,
    };

    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token", code: "TOKEN_EXPIRED" });
  }
}
