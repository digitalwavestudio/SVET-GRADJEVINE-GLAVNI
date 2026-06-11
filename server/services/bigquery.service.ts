import { BigQuery } from '@google-cloud/bigquery';
import { Logger } from '../utils/logger';

let bqClient: BigQuery | null = null;
const logger = new Logger({ service: "BigQueryService" });

export class BigQueryService {
  private static getClient(): BigQuery | null {
    if (!bqClient) {
      const projectId = process.env.BIGQUERY_PROJECT_ID;
      if (!projectId) {
        logger.warn("BIGQUERY_PROJECT_ID not set. BigQuery export disabled.");
        return null;
      }
      bqClient = new BigQuery({ projectId });
    }
    return bqClient;
  }

  private static getDatasetId(): string {
    return process.env.BIGQUERY_DATASET_ID || 'telemetry_analytics';
  }

  /**
   * Initializes the BigQuery dataset and tables if they don't exist.
   * This is safe to call multiple times as it checks for existence.
   */
  static async initializeSchema() {
    const client = this.getClient();
    if (!client) return;

    const datasetId = this.getDatasetId();
    const [dataset] = await client.dataset(datasetId).get({ autoCreate: true });

    const tables = [
      {
        id: 'events',
        schema: [
          { name: 'event_id', type: 'STRING', mode: 'REQUIRED' },
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'session_id', type: 'STRING' },
          { name: 'user_id', type: 'STRING' },
          { name: 'event_name', type: 'STRING', mode: 'REQUIRED' },
          { name: 'category', type: 'STRING' },
          { name: 'label', type: 'STRING' },
          { name: 'value', type: 'FLOAT' },
          { name: 'platform', type: 'STRING' },
          { name: 'metadata', type: 'JSON' },
        ],
      },
      {
        id: 'firestore_usage',
        schema: [
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'session_id', type: 'STRING' },
          { name: 'user_id', type: 'STRING' },
          { name: 'operation', type: 'STRING' },
          { name: 'collection', type: 'STRING' },
          { name: 'read_count', type: 'INTEGER' },
          { name: 'write_count', type: 'INTEGER' },
          { name: 'cache_hit', type: 'BOOLEAN' },
          { name: 'is_abusive', type: 'BOOLEAN' },
        ],
      },
      {
        id: 'performance_metrics',
        schema: [
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'session_id', type: 'STRING' },
          { name: 'user_id', type: 'STRING' },
          { name: 'metric_name', type: 'STRING', mode: 'REQUIRED' },
          { name: 'duration_ms', type: 'FLOAT' },
          { name: 'route', type: 'STRING' },
          { name: 'details', type: 'JSON' },
        ],
      },
      {
        id: 'error_analytics',
        schema: [
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'session_id', type: 'STRING' },
          { name: 'user_id', type: 'STRING' },
          { name: 'error_message', type: 'STRING' },
          { name: 'stack_trace', type: 'STRING' },
          { name: 'operation', type: 'STRING' },
          { name: 'collection', type: 'STRING' },
          { name: 'details', type: 'JSON' },
        ],
      },
      {
        id: 'authentication_analytics',
        schema: [
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'user_id', type: 'STRING' },
          { name: 'auth_method', type: 'STRING' },
          { name: 'event_type', type: 'STRING' },
          { name: 'status', type: 'STRING' },
        ],
      },
      {
        id: 'cost_analytics',
        schema: [
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'category', type: 'STRING' },
          { name: 'unit_count', type: 'INTEGER' },
          { name: 'estimated_cost', type: 'FLOAT' },
          { name: 'details', type: 'JSON' },
        ],
      },
      {
        id: 'threat_analytics',
        schema: [
          { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED' },
          { name: 'threat_type', type: 'STRING', mode: 'REQUIRED' }, // 'rate_limit', 'auth_abuse', 'bot_behavior', 'honeypot'
          { name: 'severity', type: 'STRING', mode: 'REQUIRED' },   // 'low', 'medium', 'high', 'critical'
          { name: 'user_id', type: 'STRING' },
          { name: 'ip_hash', type: 'STRING' },
          { name: 'user_agent', type: 'STRING' },
          { name: 'path', type: 'STRING' },
          { name: 'metadata', type: 'JSON' },
        ],
      },
    ];

    for (const tableConfig of tables) {
      await dataset.table(tableConfig.id).get({
        autoCreate: true,
        schema: tableConfig.schema,
      });
    }

    logger.info(`BigQuery schema initialized in dataset: ${datasetId}`);
  }

  /**
   * Generic export method to insert rows into a specific table
   */
  static async export(tableId: string, rows: any[]) {
    const client = this.getClient();
    if (!client || rows.length === 0) return;

    try {
      const datasetId = this.getDatasetId();
      await client.dataset(datasetId).table(tableId).insert(rows);
      logger.debug(`Exported ${rows.length} rows to BigQuery table: ${tableId}`);
    } catch (error: any) {
      // BigQuery insert errors can be nested
      if (error instanceof Error && error.name === 'PartialFailureError' && 'errors' in error) {
        (error as { errors: any[] }).errors.forEach((e: unknown) => logger.error(`Insert error at row:`, e instanceof Error ? e.message : String(e)));
      } else {
        logger.error(`BigQuery export failed for table ${tableId}:`, error instanceof Error ? error.message : String(error));
      }
    }
  }

  /**
   * Specifically handles batched telemetry from the frontend
   */
  static async processTelemetryBatch(userId: string | undefined, sessionId: string | undefined, batch: any[]) {
    const firestoreRows: any[] = [];
    const perfRows: any[] = [];
    const errorRows: any[] = [];
    const eventRows: any[] = [];

    const now = new Date().toISOString();

    for (const item of batch) {
      const base = {
        timestamp: item.timestamp || now,
        session_id: sessionId,
        user_id: userId,
      };

      switch (item.type) {
        case 'firestore':
          firestoreRows.push({
            ...base,
            operation: item.operation,
            collection: item.collection,
            read_count: item.reads || 0,
            write_count: item.writes || 0,
            cache_hit: item.cacheHit || false,
            is_abusive: item.isAbusive || false,
          });
          break;
        case 'performance':
          perfRows.push({
            ...base,
            metric_name: item.name,
            duration_ms: item.duration,
            route: item.route,
            details: item.details || {},
          });
          break;
        case 'error':
          errorRows.push({
            ...base,
            error_message: item.message,
            stack_trace: item.stack,
            operation: item.operation,
            collection: item.collection,
            details: item.details || {},
          });
          break;
        case 'event':
        default:
          eventRows.push({
            event_id: item.id || `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...base,
            event_name: item.name || 'generic_event',
            category: item.category,
            label: item.label,
            value: item.value,
            platform: item.platform || 'web',
            metadata: item.metadata || {},
          });
          break;
      }
    }

    // Parallel export to BigQuery
    await Promise.all([
      this.export('firestore_usage', firestoreRows),
      this.export('performance_metrics', perfRows),
      this.export('error_analytics', errorRows),
      this.export('events', eventRows),
    ]);
  }
}
