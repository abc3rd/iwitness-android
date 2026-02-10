// Multi-Tenant Isolation Middleware
import type { Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';

declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        slug: string;
        branding: Record<string, unknown>;
        settings: Record<string, unknown>;
      };
    }
  }
}

// Resolve tenant from subdomain, custom domain, or header
export async function resolveTenant(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let tenantSlug: string | undefined;
    let tenantDomain: string | undefined;

    // Check X-Tenant-ID header first
    const tenantHeader = req.headers['x-tenant-id'] as string | undefined;
    if (tenantHeader) {
      tenantSlug = tenantHeader;
    }

    // Check subdomain
    if (!tenantSlug) {
      const host = req.hostname;
      const parts = host.split('.');
      if (parts.length > 2) {
        tenantSlug = parts[0];
      } else {
        tenantDomain = host;
      }
    }

    // Default tenant for main domain
    if (!tenantSlug && !tenantDomain) {
      next();
      return;
    }

    let result;
    if (tenantSlug) {
      result = await query(
        'SELECT id, name, slug, branding, settings FROM tenants WHERE slug = $1 AND is_active = true',
        [tenantSlug]
      );
    } else if (tenantDomain) {
      result = await query(
        'SELECT id, name, slug, branding, settings FROM tenants WHERE domain = $1 OR custom_domain = $1 AND is_active = true',
        [tenantDomain]
      );
    }

    if (result && result.rows.length > 0) {
      req.tenant = result.rows[0] as typeof req.tenant;
    }

    next();
  } catch (err) {
    console.error('[Tenant] Resolution error:', err);
    next();
  }
}
