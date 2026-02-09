// Role-Based + Attribute-Based Access Control Middleware
import type { Request, Response, NextFunction } from 'express';

type Role = string;

// Role hierarchy — higher roles inherit lower role permissions
const ROLE_HIERARCHY: Record<Role, Role[]> = {
  super_admin: ['admin', 'tenant_owner', 'attorney', 'medical_provider', 'affiliate', 'client'],
  admin: ['tenant_owner', 'attorney', 'medical_provider', 'affiliate', 'client'],
  tenant_owner: ['attorney', 'medical_provider', 'affiliate', 'client'],
  attorney: ['client'],
  medical_provider: ['client'],
  affiliate: ['client'],
  client: [],
};

function hasRole(userRole: string, requiredRole: string): boolean {
  if (userRole === requiredRole) return true;
  const inherited = ROLE_HIERARCHY[userRole] || [];
  return inherited.includes(requiredRole);
}

// Require one of the specified roles
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const userRole = req.auth.role;
    const authorized = roles.some((role) => hasRole(userRole, role));

    if (!authorized) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
      });
      return;
    }

    next();
  };
}

// Require tenant match (multi-tenant isolation)
export function requireTenant(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
    return;
  }

  // Super admins can access any tenant
  if (req.auth.role === 'super_admin') {
    next();
    return;
  }

  const requestedTenantId = req.params.tenantId || req.body?.tenantId || req.query.tenantId;
  if (requestedTenantId && requestedTenantId !== req.auth.tenantId) {
    res.status(403).json({
      success: false,
      error: { code: 'TENANT_MISMATCH', message: 'Cross-tenant access denied' },
    });
    return;
  }

  next();
}

// Resource ownership check
export function requireOwnership(resourceUserIdField: string = 'userId') {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Admins bypass ownership check
    if (hasRole(req.auth.role, 'admin')) {
      next();
      return;
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body?.[resourceUserIdField];
    if (resourceUserId && resourceUserId !== req.auth.userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Resource access denied' },
      });
      return;
    }

    next();
  };
}
