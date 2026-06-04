import { Router } from 'express';
import { BigQueryService } from '../services/bigquery.service.ts';
import { AuditService, AuditAction } from '../services/audit.service.ts';
import { Logger } from '../utils/logger.ts';
import { trace } from '@opentelemetry/api';

const router = Router();
const logger = new Logger({ service: "TelemetryRouter" });
const tracer = trace.getTracer('telemetry-proxy');

/**
 * @api {post} /api/telemetry/otel/traces OTLP Trace Proxy
 */
router.post('/otel/traces', async (req, res) => {
  try {
    const spans = req.body.resourceSpans || [];
    const bqRows = [];

    for (const rs of spans) {
      const serviceName = rs.resource?.attributes?.find((a: any) => a.key === 'service.name')?.value?.stringValue || 'frontend';
      for (const ils of rs.scopeSpans || []) {
        for (const span of ils.spans || []) {
          bqRows.push({
            timestamp: new Date(Number(span.startTimeUnixNano) / 1000000).toISOString(),
            metric_name: `otel_${span.name}`,
            duration_ms: (Number(span.endTimeUnixNano) - Number(span.startTimeUnixNano)) / 1000000,
            route: span.attributes?.find((a: any) => a.key === 'http.url')?.value?.stringValue || 'unknown',
            details: {
              service: serviceName,
              traceId: span.traceId,
              spanId: span.spanId,
              parentSpanId: span.parentSpanId,
              status: span.status
            }
          });
        }
      }
    }

    if (bqRows.length > 0) {
      BigQueryService.export('performance_metrics', bqRows).catch(err => {
        logger.error("BigQuery metrics export background process failed:", err);
      });
    }

    return res.status(202).send();
  } catch (error) {
    logger.error("OTLP Proxy failed:", error);
    return res.status(500).send();
  }
});

/**
 * @api {post} /api/telemetry/export Batched telemetry export to BigQuery
 */
router.post('/export', async (req, res) => {
  try {
    const { userId, sessionId, batch } = req.body;

    if (!Array.isArray(batch)) {
      return res.status(400).json({ error: "Batch must be an array" });
    }

    // Fire and forget telemetry export so we don't block the API response
    BigQueryService.processTelemetryBatch(userId, sessionId, batch).catch(err => {
        logger.error("Telemetry export background process failed:", err);
    });

    return res.status(202).json({ status: "accepted" });
  } catch (error) {
    logger.error("Telemetry export route failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @api {post} /api/telemetry/auth Auth event tracking
 */
router.post('/auth', async (req, res) => {
  try {
    const { userId, authMethod, eventType, status } = req.body;

    BigQueryService.export('authentication_analytics', [{
      timestamp: new Date().toISOString(),
      user_id: userId,
      auth_method: authMethod,
      event_type: eventType,
      status: status
    }]).catch(err => {
      logger.error("BigQuery auth analytics export failed:", err);
    });

    if (status === 'failed') {
      const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      // This is fire-and-forget inside reportThreat, we don't need to block
      AuditService.log({
        action: AuditAction.SECURITY_THREAT,
        severity: 'medium',
        ip: Array.isArray(ip) ? ip[0] : ip,
        userId,
        details: { authMethod, eventType, type: 'auth_abuse' }
      }).catch(err => {
        logger.error("Security report in auth fail failed:", err);
      });
    }

    return res.json({ status: "success" });
  } catch (error) {
    logger.error("Auth telemetry export failed:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
