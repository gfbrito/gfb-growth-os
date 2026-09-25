import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../../services/prisma.js";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          include: {
            organization: true,
          },
        },
        clientAccesses: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: "Invalid credentials", code: "INVALID_CREDENTIALS" });
      return;
    }

    const primaryMembership = user.memberships[0];
    const role = primaryMembership?.role ?? "CLIENT";
    const organizationId = primaryMembership?.organizationId;

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role,
        organizationId,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: "8h" }
    );

    const refreshToken = jwt.sign(
      { sub: user.id },
      env.JWT_REFRESH_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logger.info({ userId: user.id, email: user.email }, "User logged in successfully");

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role,
        organization: primaryMembership?.organization
          ? {
              id: primaryMembership.organization.id,
              name: primaryMembership.organization.name,
              slug: primaryMembership.organization.slug,
            }
          : null,
        accessibleClients: user.clientAccesses.map((ca) => ({
          id: ca.client.id,
          name: ca.client.name,
          slug: ca.client.slug,
          isPrimaryGestor: ca.isPrimaryGestor,
        })),
      },
      token: accessToken,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: "Validation failed", details: err.format() });
      return;
    }
    logger.error({ err }, "Login error");
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.json({ message: "Logged out successfully" });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      memberships: {
        include: { organization: true },
      },
      clientAccesses: {
        include: { client: true },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const primaryMembership = user.memberships[0];

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: req.user.role,
      organization: primaryMembership?.organization
        ? {
            id: primaryMembership.organization.id,
            name: primaryMembership.organization.name,
            slug: primaryMembership.organization.slug,
          }
        : null,
      accessibleClients: user.clientAccesses.map((ca) => ({
        id: ca.client.id,
        name: ca.client.name,
        slug: ca.client.slug,
        isPrimaryGestor: ca.isPrimaryGestor,
      })),
    },
  });
}
