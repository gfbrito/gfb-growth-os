/**
 * GFB Growth OS — Role-Based Access Control (RBAC) Middleware
 * Perfis:
 * - MASTER_AGENCY (SUPER_ADMIN / OWNER): Acesso irrestrito a todos os clientes, CAPI, finanças e configurações.
 * - AGENCY_OPERATOR (GESTOR / ADMIN): Opera contas atribuídas, cria campanhas e opera Mini ClickUp.
 * - CLIENT_OWNER (CLIENT): Dono da conta do infoproduto (dashboards de vendas, CRM, relatórios).
 * - CLIENT_ATTENDANT (COLLABORATOR): Atendente de WhatsApp (visão restrita apenas ao Inbox de mensagens).
 */

import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";
import { AuthenticatedUser } from "./auth.js";

export type GrowthOsRole = "MASTER_AGENCY" | "AGENCY_OPERATOR" | "CLIENT_OWNER" | "CLIENT_ATTENDANT";

export function authUserMiddleware(req: Request, res: Response, next: NextFunction): void {
  const roleHeader = (req.headers["x-user-role"] as string) || "MASTER_AGENCY";

  let prismaRole: UserRole = UserRole.OWNER;
  if (roleHeader === "CLIENT_ATTENDANT") prismaRole = UserRole.COLLABORATOR;
  else if (roleHeader === "CLIENT_OWNER") prismaRole = UserRole.CLIENT;
  else if (roleHeader === "AGENCY_OPERATOR") prismaRole = UserRole.GESTOR;
  else prismaRole = UserRole.SUPER_ADMIN;

  const isClientUser = roleHeader === "CLIENT_ATTENDANT" || roleHeader === "CLIENT_OWNER";

  const user: AuthenticatedUser & { growthRole: GrowthOsRole } = {
    id: roleHeader === "CLIENT_ATTENDANT" ? "usr_attendant_01" : "usr_gisley",
    name:
      roleHeader === "CLIENT_ATTENDANT"
        ? "Carla Atendente"
        : roleHeader === "CLIENT_OWNER"
        ? "Bruna Ortiz"
        : "Gisley Fernandes",
    email:
      roleHeader === "CLIENT_ATTENDANT"
        ? "atendimento@brunaortiz.com"
        : "gisley@gfbdigital.com.br",
    role: prismaRole,
    growthRole: (roleHeader as GrowthOsRole) || "MASTER_AGENCY",
    organizationId: "org_gfb_digital",
    clientId: (req.headers["x-client-id"] as string) || (isClientUser ? "cli_bruna_ppp" : undefined),
    clientName: isClientUser ? "Bruna Ortiz - PPP" : undefined,
    clientSlug: isClientUser ? "brunaortiz_ppp" : undefined,
  };

  req.user = user;
  next();
}

/**
 * Guardião de permissão RBAC
 */
export function requireGrowthRoles(...allowedRoles: GrowthOsRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const currentGrowthRole = (req.user as any)?.growthRole || "MASTER_AGENCY";

    if (!allowedRoles.includes(currentGrowthRole)) {
      res.status(403).json({
        error: "Acesso Negado (RBAC)",
        message: `O seu perfil (${currentGrowthRole}) não possui permissão para acessar este recurso.`,
        requiredRoles: allowedRoles,
      });
      return;
    }

    next();
  };
}
