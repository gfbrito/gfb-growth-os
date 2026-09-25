import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { prisma } from "../services/prisma.js";

/**
 * Ensures the logged in user has one of the required roles
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
      return;
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: "Forbidden: insufficient permissions",
        code: "FORBIDDEN_ROLE",
      });
      return;
    }

    next();
  };
}

/**
 * Validates that the requested clientId belongs to the user's organization
 * and that the user has permission to access this specific client
 */
export async function requireClientScope(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required", code: "UNAUTHORIZED" });
    return;
  }

  const clientId = req.params.clientId || req.body.clientId || (req.query.clientId as string);

  if (!clientId) {
    res.status(400).json({ error: "clientId parameter is required", code: "MISSING_CLIENT_ID" });
    return;
  }

  if (req.user.role === UserRole.SUPER_ADMIN) {
    return next();
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      organizationId: true,
      members: {
        where: { userId: req.user.id },
        select: { id: true, isPrimaryGestor: true },
      },
    },
  });

  if (!client) {
    res.status(404).json({ error: "Client not found", code: "CLIENT_NOT_FOUND" });
    return;
  }

  // Cross-tenant check: must belong to the user's organization
  if (client.organizationId !== req.user.organizationId) {
    res.status(403).json({
      error: "Forbidden: Client does not belong to your organization",
      code: "TENANT_MISMATCH",
    });
    return;
  }

  // If user is Owner or Admin, they have access to all clients in the organization
  if (req.user.role === UserRole.OWNER || req.user.role === UserRole.ADMIN) {
    return next();
  }

  // If user is Gestor, Collaborator or Client, they must have an explicit assignment in client_members
  const hasDirectAccess = client.members.length > 0;
  if (!hasDirectAccess) {
    res.status(403).json({
      error: "Forbidden: You do not have access to this client",
      code: "CLIENT_ACCESS_DENIED",
    });
    return;
  }

  next();
}
