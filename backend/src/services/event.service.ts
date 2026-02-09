// Event Detection & Processing Service
// Handles crash detection, geofencing, sensor events
import { query } from '../config/database.js';
import { leadService } from './lead.service.js';

export interface SensorEventInput {
  userId?: string;
  deviceId?: string;
  eventType: string;
  severity: number;
  lat?: number;
  lng?: number;
  altitude?: number;
  speed?: number;
  accelerometerData?: { x: number; y: number; z: number };
  gyroscopeData?: { x: number; y: number; z: number };
  rawSensorData?: Record<string, unknown>;
}

// Crash detection thresholds
const CRASH_THRESHOLDS = {
  accelerationG: 4.0,        // > 4G likely crash
  decelerationG: -3.0,       // sudden braking
  gyroRotation: 200,         // degrees/sec — rollover
  speedDropKmh: 50,          // sudden speed drop
  severityAutoLead: 60,      // auto-generate lead above this severity
};

function classifySensorEvent(input: SensorEventInput): {
  classification: string;
  confidence: number;
  severity: number;
} {
  const accel = input.accelerometerData || { x: 0, y: 0, z: 0 };
  const gyro = input.gyroscopeData || { x: 0, y: 0, z: 0 };

  const totalAccel = Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2);
  const totalGyro = Math.sqrt(gyro.x ** 2 + gyro.y ** 2 + gyro.z ** 2);

  // Crash detection
  if (totalAccel > CRASH_THRESHOLDS.accelerationG * 9.81) {
    const severity = Math.min(100, (totalAccel / (10 * 9.81)) * 100);
    return { classification: 'vehicle_crash', confidence: 0.85, severity };
  }

  // Sudden deceleration
  if (accel.x < CRASH_THRESHOLDS.decelerationG * 9.81) {
    return { classification: 'sudden_deceleration', confidence: 0.7, severity: 40 };
  }

  // Rollover
  if (totalGyro > CRASH_THRESHOLDS.gyroRotation) {
    return { classification: 'vehicle_rollover', confidence: 0.8, severity: 90 };
  }

  // General high-impact event
  if (totalAccel > 2 * 9.81) {
    return { classification: 'high_impact_event', confidence: 0.5, severity: 30 };
  }

  return { classification: 'normal', confidence: 0.9, severity: 0 };
}

export const eventService = {
  async processSensorEvent(input: SensorEventInput) {
    const { classification, confidence, severity } = classifySensorEvent(input);
    const effectiveSeverity = Math.max(input.severity, severity);

    const locationPoint = input.lat && input.lng
      ? `SRID=4326;POINT(${input.lng} ${input.lat})`
      : null;

    // Store the sensor event
    const result = await query(
      `INSERT INTO sensor_events (
        user_id, device_id, event_type, severity, location, altitude, speed,
        accelerometer_data, gyroscope_data, raw_sensor_data,
        ai_classification, confidence
      ) VALUES ($1,$2,$3,$4,ST_GeomFromEWKT($5),$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        input.userId || null, input.deviceId || null,
        input.eventType, effectiveSeverity, locationPoint,
        input.altitude || null, input.speed || null,
        JSON.stringify(input.accelerometerData || {}),
        JSON.stringify(input.gyroscopeData || {}),
        JSON.stringify(input.rawSensorData || {}),
        classification, confidence,
      ]
    );

    const sensorEvent = result.rows[0] as Record<string, unknown>;
    let lead = null;

    // Auto-generate lead for high-severity events
    if (effectiveSeverity >= CRASH_THRESHOLDS.severityAutoLead && input.userId) {
      const user = await query('SELECT email, full_name, phone FROM users WHERE id = $1', [input.userId]);
      if (user.rows.length > 0) {
        const u = user.rows[0] as Record<string, string>;
        lead = await leadService.create({
          source: 'event_trigger',
          fullName: u.full_name || u.email,
          email: u.email,
          phone: u.phone,
          lat: input.lat,
          lng: input.lng,
          incidentType: classification,
          incidentDate: new Date().toISOString(),
          incidentDescription: `Auto-detected ${classification} event. Severity: ${effectiveSeverity}. Speed: ${input.speed || 'unknown'} km/h.`,
        });

        // Link lead to sensor event
        await query(
          'UPDATE sensor_events SET lead_generated = true, lead_id = $1 WHERE id = $2',
          [lead.id, sensorEvent.id]
        );
      }
    }

    return {
      event: sensorEvent,
      classification,
      confidence,
      severity: effectiveSeverity,
      leadGenerated: lead !== null,
      lead,
    };
  },

  async checkGeofences(userId: string, lat: number, lng: number) {
    // Find all geofences that contain this point
    const result = await query(
      `SELECT g.*, ST_Distance(
        g.center::geography,
        ST_GeomFromText($1, 4326)::geography
      ) as distance_meters
      FROM geofences g
      WHERE g.is_active = true
      AND ST_DWithin(
        g.boundary::geography,
        ST_GeomFromText($1, 4326)::geography,
        0
      )`,
      [`POINT(${lng} ${lat})`]
    );

    const triggeredFences = result.rows;
    const events = [];

    for (const fence of triggeredFences) {
      const f = fence as Record<string, unknown>;
      // Record location event
      const eventResult = await query(
        `INSERT INTO location_events (user_id, geofence_id, event_type, location)
         VALUES ($1, $2, 'enter', ST_GeomFromText($3, 4326))
         RETURNING *`,
        [userId, f.id, `POINT(${lng} ${lat})`]
      );

      events.push({
        geofence: f,
        event: eventResult.rows[0],
        actions: f.trigger_actions,
      });
    }

    return events;
  },

  async getRecentEvents(userId: string, limit: number = 50) {
    const result = await query(
      `SELECT * FROM sensor_events WHERE user_id = $1
       ORDER BY created_at DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  },

  async getEventHotspots(lat: number, lng: number, radiusKm: number = 10) {
    const result = await query(
      `SELECT
        ST_AsGeoJSON(location) as geo,
        event_type,
        COUNT(*) as event_count,
        AVG(severity) as avg_severity
       FROM sensor_events
       WHERE location IS NOT NULL
       AND ST_DWithin(
         location::geography,
         ST_GeomFromText($1, 4326)::geography,
         $2
       )
       AND created_at > NOW() - INTERVAL '90 days'
       GROUP BY ST_AsGeoJSON(location), event_type
       ORDER BY event_count DESC
       LIMIT 100`,
      [`POINT(${lng} ${lat})`, radiusKm * 1000]
    );
    return result.rows;
  },

  async createGeofence(input: {
    tenantId?: string;
    name: string;
    type: string;
    centerLat: number;
    centerLng: number;
    radiusMeters: number;
    triggerActions?: unknown[];
  }) {
    // Create a circular geofence
    const result = await query(
      `INSERT INTO geofences (tenant_id, name, type, boundary, center, radius_meters, trigger_actions)
       VALUES (
         $1, $2, $3,
         ST_Buffer(ST_GeomFromText($4, 4326)::geography, $5)::geometry,
         ST_GeomFromText($4, 4326),
         $5, $6
       ) RETURNING *`,
      [
        input.tenantId || null, input.name, input.type,
        `POINT(${input.centerLng} ${input.centerLat})`,
        input.radiusMeters,
        JSON.stringify(input.triggerActions || []),
      ]
    );
    return result.rows[0];
  },
};
