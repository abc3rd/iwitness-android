// Authentication Service
import bcrypt from 'bcryptjs';
import { query, transaction } from '../config/database.js';
import { generateTokens, type AuthPayload } from '../middleware/auth.js';

export interface SignUpInput {
  email: string;
  password: string;
  fullName: string;
  role?: string;
  tenantId?: string;
  phone?: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export const authService = {
  async signUp(input: SignUpInput) {
    const { email, password, fullName, role = 'client', tenantId, phone } = input;

    // Check existing
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    return transaction(async (client) => {
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name, role, tenant_id, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, full_name, role, tenant_id`,
        [email, passwordHash, fullName, role, tenantId || null, phone || null]
      );

      const user = userResult.rows[0];

      // Auto-create affiliate profile for every user
      const handle = email.split('@')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase() || 'REFERRAL';
      const affiliateCode = `UCRASH-${handle}`;

      await client.query(
        `INSERT INTO affiliates (user_id, tenant_id, affiliate_code, referral_url)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO NOTHING`,
        [user.id, tenantId || null, affiliateCode, `https://ucrash.claims/r/${affiliateCode}`]
      );

      const payload: AuthPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
      };

      const tokens = generateTokens(payload);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          tenantId: user.tenant_id,
          affiliateCode,
        },
        tokens,
      };
    });
  },

  async signIn(input: SignInInput) {
    const { email, password } = input;

    const result = await query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.role, u.tenant_id, u.is_active,
              a.affiliate_code, a.referral_url
       FROM users u
       LEFT JOIN affiliates a ON a.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = result.rows[0] as Record<string, string>;

    if (user.is_active === 'false' || user.is_active === false as unknown as string) {
      throw new Error('Account is deactivated');
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
    };

    const tokens = generateTokens(payload);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id,
        affiliateCode: user.affiliate_code,
        referralUrl: user.referral_url,
      },
      tokens,
    };
  },

  async refreshToken(userId: string) {
    const result = await query(
      'SELECT id, email, role, tenant_id FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = result.rows[0] as Record<string, string>;
    const payload: AuthPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id,
    };

    return generateTokens(payload);
  },

  async getProfile(userId: string) {
    const result = await query(
      `SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, u.phone, u.avatar_url,
              u.mfa_enabled, u.created_at,
              a.affiliate_code, a.referral_url, a.lifetime_earnings, a.pending_balance,
              a.total_referrals, a.total_conversions, a.commission_rate
       FROM users u
       LEFT JOIN affiliates a ON a.user_id = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  },

  async magicLink(email: string) {
    // Generate a magic link token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Ensure user exists
    let result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Auto-create for magic link flow
      result = await query(
        `INSERT INTO users (email, role) VALUES ($1, 'client') RETURNING id`,
        [email]
      );
    }

    const userId = (result.rows[0] as { id: string }).id;

    await query(
      `INSERT INTO auth_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );

    return { token, expiresAt };
  },
};
