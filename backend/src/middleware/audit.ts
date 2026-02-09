// Audit Logging Middleware
import type { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';

export interface AuditEntry {
  tenantId?: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_log (tenant_id, user_id, action, resource_type, resource_id, old_values, new_values, ip_address, user_agent, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        entry.tenantId || null,
        entry.userId || null,
        entry.action,
        entry.resourceType,
        entry.resourceId || null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.ipAddress || null,
        entry.userAgent || null,
        entry.metadata ? JSON.stringify(entry.metadata) : '{}',
      ]
    );
  } catch (err) {
    console.error('[Audit] Failed to log audit entry:', err);
  }
}

// Express middleware that auto-logs write operations
export function auditMiddleware(resourceType: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const originalJson = res.json.bind(res);
      res.json = function (body: unknown) {
        logAudit({
          tenantId: req.auth?.tenantId,
          userId: req.auth?.userId,
          action: `${req.method} ${req.path}`,
          resourceType,
          resourceId: req.params.id,
          newValues: req.method !== 'DELETE' ? (req.body as Record<string, unknown>) : undefined,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        });
        return originalJson(body);
      };
    }
    next();
  };
}
