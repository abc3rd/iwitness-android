// Payment & Monetization API Routes
import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';
import { query } from '../../config/database.js';

export const paymentsRoutes = Router();

// GET /api/v1/payments/transactions — List transactions
paymentsRoutes.get('/transactions', authenticate, async (req, res) => {
  try {
    const { type, status, page = '1', pageSize = '25' } = req.query;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    // Users see only their own transactions unless admin
    if (req.auth!.role !== 'admin' && req.auth!.role !== 'super_admin') {
      conditions.push(`(user_id = $${idx} OR affiliate_id IN (SELECT id FROM affiliates WHERE user_id = $${idx}))`);
      params.push(req.auth!.userId);
      idx++;
    }

    if (type) { conditions.push(`type = $${idx++}`); params.push(type); }
    if (status) { conditions.push(`status = $${idx++}`); params.push(status); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page as string, 10) - 1) * parseInt(pageSize as string, 10);

    const result = await query(
      `SELECT * FROM transactions ${where} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(pageSize as string, 10), offset]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list transactions' } });
  }
});

// POST /api/v1/payments/payout-request — Request affiliate payout
paymentsRoutes.post('/payout-request', authenticate, async (req, res) => {
  try {
    const { affiliateId, amount } = req.body;

    // Verify affiliate owns this account
    const affiliate = await query(
      'SELECT * FROM affiliates WHERE id = $1 AND user_id = $2',
      [affiliateId, req.auth!.userId]
    );

    if (affiliate.rows.length === 0) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your affiliate account' } });
      return;
    }

    const aff = affiliate.rows[0] as Record<string, string>;
    if (parseFloat(aff.pending_balance) < amount) {
      res.status(400).json({ success: false, error: { code: 'INSUFFICIENT', message: 'Insufficient balance' } });
      return;
    }

    // Create payout transaction
    const result = await query(
      `INSERT INTO transactions (affiliate_id, user_id, type, status, amount, description)
       VALUES ($1, $2, 'payout', 'processing', $3, 'Affiliate payout request')
       RETURNING *`,
      [affiliateId, req.auth!.userId, amount]
    );

    // Deduct from pending balance
    await query(
      'UPDATE affiliates SET pending_balance = pending_balance - $1 WHERE id = $2',
      [amount, affiliateId]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'PAYOUT_FAILED', message: 'Payout request failed' } });
  }
});

// POST /api/v1/payments/webhook/stripe — Stripe webhook
paymentsRoutes.post('/webhook/stripe', async (req, res) => {
  try {
    // Stripe webhook handling
    const event = req.body;

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await query(
          `UPDATE transactions SET status = 'completed', processed_at = NOW(), stripe_payment_id = $1
           WHERE stripe_payment_id = $1`,
          [paymentIntent.id]
        );
        break;
      }
      case 'payment_intent.payment_failed': {
        const failedPayment = event.data.object;
        await query(
          `UPDATE transactions SET status = 'failed' WHERE stripe_payment_id = $1`,
          [failedPayment.id]
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).json({ error: 'Webhook handling failed' });
  }
});

// GET /api/v1/payments/summary — Payment summary for admin
paymentsRoutes.get('/summary', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT
        type,
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
       FROM transactions
       ${req.auth!.tenantId ? 'WHERE tenant_id = $1' : ''}
       GROUP BY type, status
       ORDER BY type, status`,
      req.auth!.tenantId ? [req.auth!.tenantId] : []
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SUMMARY_FAILED', message: 'Failed to fetch payment summary' } });
  }
});
