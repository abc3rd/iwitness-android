// CRM Pipeline API Routes — LegendaryLeads Fusion
import { Router } from 'express';
import { crmService } from '../../services/crm.service.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

export const crmRoutes = Router();

// -- Pipelines --

// GET /api/v1/crm/pipelines
crmRoutes.get('/pipelines', authenticate, async (req, res) => {
  try {
    const pipelines = await crmService.getPipelines(req.auth!.tenantId);
    res.json({ success: true, data: pipelines });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list pipelines' } });
  }
});

// POST /api/v1/crm/pipelines
crmRoutes.post('/pipelines', authenticate, requireRole('admin', 'attorney'), async (req, res) => {
  try {
    const pipeline = await crmService.createPipeline({
      tenantId: req.auth!.tenantId,
      name: req.body.name,
      description: req.body.description,
      createdBy: req.auth!.userId,
    });
    res.status(201).json({ success: true, data: pipeline });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message: 'Failed to create pipeline' } });
  }
});

// GET /api/v1/crm/pipelines/default
crmRoutes.get('/pipelines/default', authenticate, async (req, res) => {
  try {
    const pipeline = await crmService.getDefaultPipeline(req.auth!.tenantId);
    res.json({ success: true, data: pipeline });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: 'Failed to fetch default pipeline' } });
  }
});

// GET /api/v1/crm/pipelines/:id/summary
crmRoutes.get('/pipelines/:id/summary', authenticate, async (req, res) => {
  try {
    const summary = await crmService.getPipelineSummary(req.params.id);
    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'SUMMARY_FAILED', message: 'Failed to fetch pipeline summary' } });
  }
});

// -- Deals --

// POST /api/v1/crm/deals
crmRoutes.post('/deals', authenticate, async (req, res) => {
  try {
    const deal = await crmService.createDeal({
      ...req.body,
      tenantId: req.auth!.tenantId,
    });
    res.status(201).json({ success: true, data: deal });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message: 'Failed to create deal' } });
  }
});

// GET /api/v1/crm/deals?pipelineId=xxx
crmRoutes.get('/deals', authenticate, async (req, res) => {
  try {
    const pipelineId = req.query.pipelineId as string;
    if (!pipelineId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'pipelineId is required' } });
      return;
    }
    const deals = await crmService.getDealsByPipeline(pipelineId);
    res.json({ success: true, data: deals });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list deals' } });
  }
});

// PATCH /api/v1/crm/deals/:id/move — Move deal to new stage
crmRoutes.patch('/deals/:id/move', authenticate, async (req, res) => {
  try {
    const { stage } = req.body;
    const deal = await crmService.moveDeal(req.params.id, stage);
    res.json({ success: true, data: deal });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'MOVE_FAILED', message: 'Failed to move deal' } });
  }
});

// GET /api/v1/crm/deals/by-stage?pipelineId=xxx
crmRoutes.get('/deals/by-stage', authenticate, async (req, res) => {
  try {
    const pipelineId = req.query.pipelineId as string;
    if (!pipelineId) {
      res.status(400).json({ success: false, error: { code: 'VALIDATION', message: 'pipelineId is required' } });
      return;
    }
    const stages = await crmService.getDealsByStage(pipelineId);
    res.json({ success: true, data: stages });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'STAGE_FAILED', message: 'Failed to fetch deals by stage' } });
  }
});

// -- Activities --

// POST /api/v1/crm/activities
crmRoutes.post('/activities', authenticate, async (req, res) => {
  try {
    const activity = await crmService.createActivity({
      ...req.body,
      userId: req.auth!.userId,
    });
    res.status(201).json({ success: true, data: activity });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'CREATE_FAILED', message: 'Failed to create activity' } });
  }
});

// GET /api/v1/crm/activities
crmRoutes.get('/activities', authenticate, async (req, res) => {
  try {
    const activities = await crmService.getActivities({
      dealId: req.query.dealId as string,
      leadId: req.query.leadId as string,
      userId: req.query.userId as string,
      status: req.query.status as string,
    });
    res.json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, error: { code: 'LIST_FAILED', message: 'Failed to list activities' } });
  }
});

// PATCH /api/v1/crm/activities/:id/complete
crmRoutes.patch('/activities/:id/complete', authenticate, async (req, res) => {
  try {
    const activity = await crmService.completeActivity(req.params.id, req.body.outcome);
    res.json({ success: true, data: activity });
  } catch (err) {
    res.status(400).json({ success: false, error: { code: 'COMPLETE_FAILED', message: 'Failed to complete activity' } });
  }
});
