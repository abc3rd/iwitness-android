// Authentication API Routes
import { Router } from 'express';
import { authService } from '../../services/auth.service.js';
import { authenticate } from '../../middleware/auth.js';
import { logAudit } from '../../middleware/audit.js';

export const authRoutes = Router();

// POST /api/v1/auth/signup
authRoutes.post('/signup', async (req, res) => {
  try {
    const { email, password, fullName, role, phone } = req.body;
    if (!email || !password || !fullName) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'email, password, and fullName are required' } });
      return;
    }

    const result = await authService.signUp({ email, password, fullName, role, phone, tenantId: req.tenant?.id });

    await logAudit({ action: 'signup', resourceType: 'users', userId: result.user.id, ipAddress: req.ip });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signup failed';
    res.status(400).json({ success: false, error: { code: 'SIGNUP_FAILED', message } });
  }
});

// POST /api/v1/auth/signin
authRoutes.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'email and password are required' } });
      return;
    }

    const result = await authService.signIn({ email, password });

    await logAudit({ action: 'signin', resourceType: 'users', userId: result.user.id, ipAddress: req.ip });

    res.json({ success: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sign in failed';
    res.status(401).json({ success: false, error: { code: 'AUTH_FAILED', message } });
  }
});

// POST /api/v1/auth/magic-link
authRoutes.post('/magic-link', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'email is required' } });
      return;
    }
    const result = await authService.magicLink(email);
    res.json({ success: true, data: { message: 'Magic link sent', expiresAt: result.expiresAt } });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'MAGIC_LINK_FAILED', message: 'Failed to send magic link' } });
  }
});

// POST /api/v1/auth/refresh
authRoutes.post('/refresh', authenticate, async (req, res) => {
  try {
    const tokens = await authService.refreshToken(req.auth!.userId);
    res.json({ success: true, data: tokens });
  } catch (err) {
    res.status(401).json({ success: false, error: { code: 'REFRESH_FAILED', message: 'Token refresh failed' } });
  }
});

// GET /api/v1/auth/profile
authRoutes.get('/profile', authenticate, async (req, res) => {
  try {
    const profile = await authService.getProfile(req.auth!.userId);
    res.json({ success: true, data: profile });
  } catch (err) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Profile not found' } });
  }
});

// POST /api/v1/auth/signout
authRoutes.post('/signout', authenticate, async (_req, res) => {
  res.json({ success: true, data: { message: 'Signed out' } });
});
