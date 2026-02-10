// Event Pipeline — Central event processing hub
// Handles crash detection, geofence triggers, lead capture, affiliate matching

import { eventService } from '../services/event.service.js';
import { leadService } from '../services/lead.service.js';
import { offerService } from '../services/offer.service.js';
import { query } from '../config/database.js';

export type PipelineEvent = {
  type: string;
  userId?: string;
  data: Record<string, unknown>;
  timestamp: string;
};

type EventHandler = (event: PipelineEvent) => Promise<void>;

const handlers: Map<string, EventHandler[]> = new Map();

// Register event handler
export function on(eventType: string, handler: EventHandler) {
  const existing = handlers.get(eventType) || [];
  existing.push(handler);
  handlers.set(eventType, existing);
}

// Emit event to pipeline
export async function emit(event: PipelineEvent) {
  const eventHandlers = handlers.get(event.type) || [];
  const wildcardHandlers = handlers.get('*') || [];
  const allHandlers = [...eventHandlers, ...wildcardHandlers];

  const results = await Promise.allSettled(
    allHandlers.map((handler) => handler(event))
  );

  const failures = results.filter((r) => r.status === 'rejected');
  if (failures.length > 0) {
    console.error(`[Pipeline] ${failures.length} handlers failed for event ${event.type}`);
  }
}

// ============================================================
// Built-in Event Handlers
// ============================================================

// Crash Detection Handler
on('sensor_event', async (event) => {
  const data = event.data;
  if (data.severity && (data.severity as number) >= 60) {
    console.log(`[Pipeline] High-severity sensor event detected for user ${event.userId}`);

    // Auto-create lead
    if (event.userId) {
      const userResult = await query(
        'SELECT email, full_name, phone FROM users WHERE id = $1',
        [event.userId]
      );
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0] as Record<string, string>;
        await leadService.create({
          source: 'event_trigger',
          fullName: user.full_name || user.email,
          email: user.email,
          phone: user.phone,
          lat: data.lat as number,
          lng: data.lng as number,
          incidentType: data.classification as string || 'auto_accident',
          incidentDate: event.timestamp,
          incidentDescription: `Auto-detected event: ${data.classification}. Severity: ${data.severity}.`,
        });
      }
    }
  }
});

// Geofence Entry Handler
on('geofence_entry', async (event) => {
  const data = event.data;
  console.log(`[Pipeline] Geofence entry: user ${event.userId} entered ${data.geofenceName}`);

  // Match with relevant offers based on geofence type
  if (data.geofenceType === 'medical_center') {
    const offers = await offerService.getTopOffers({
      category: 'medical',
      limit: 3,
    });
    if (offers.length > 0) {
      // Create notification with matched offers
      await query(
        `INSERT INTO notifications (user_id, type, title, body, channel, action_data)
         VALUES ($1, 'offer_match', 'Relevant Offers Nearby', $2, 'in_app', $3)`,
        [
          event.userId,
          `We found ${offers.length} offers relevant to your location.`,
          JSON.stringify({ offers: offers.map((o: Record<string, unknown>) => o.id) }),
        ]
      );
    }
  }
});

// QR Scan Handler
on('qr_scan', async (event) => {
  const data = event.data;
  console.log(`[Pipeline] QR scan: campaign ${data.campaignId} by ${event.userId || 'anonymous'}`);

  // Track analytics
  await query(
    `INSERT INTO analytics_events (user_id, event_name, event_category, event_data, utm_source)
     VALUES ($1, 'qr_scan', 'acquisition', $2, 'qr')`,
    [event.userId || null, JSON.stringify(data)]
  );
});

// Lead Created Handler
on('lead_created', async (event) => {
  const data = event.data;
  console.log(`[Pipeline] New lead created: ${data.leadId}`);

  // Notify assigned user / nearby affiliates
  if (data.assignedTo) {
    await query(
      `INSERT INTO notifications (user_id, type, title, body, channel)
       VALUES ($1, 'new_lead', 'New Lead Assigned', $2, 'push')`,
      [data.assignedTo, `New lead: ${data.fullName} (${data.source})`]
    );
  }
});

// Conversion Handler
on('conversion', async (event) => {
  const data = event.data;
  console.log(`[Pipeline] Conversion recorded: ${data.referenceId}`);

  // Process affiliate commission
  if (data.affiliateId) {
    await query(
      `INSERT INTO transactions (affiliate_id, type, status, amount, description, reference_type, reference_id)
       VALUES ($1, 'commission', 'pending', $2, $3, $4, $5)`,
      [
        data.affiliateId,
        data.commissionAmount || 0,
        `Commission for ${data.referenceType} conversion`,
        data.referenceType,
        data.referenceId,
      ]
    );

    await query(
      'UPDATE affiliates SET pending_balance = pending_balance + $1 WHERE id = $2',
      [data.commissionAmount || 0, data.affiliateId]
    );
  }
});

export const eventPipeline = { on, emit };
