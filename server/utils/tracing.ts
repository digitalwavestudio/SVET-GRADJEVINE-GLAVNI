
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { Logger } from './logger.ts';

const logger = new Logger({ service: "Tracing" });

const isTracingEnabled = process.env.ENABLE_TRACING === "true" || !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

/**
 * Svet Gradjevine - Distributed Tracing Initialization
 */
let sdk: NodeSDK | null = null;

if (isTracingEnabled) {
  try {
    sdk = new NodeSDK({
      // @ts-ignore - Handle possible OTel version mismatches
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'svet-gradjevine-backend',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development',
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      }),
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });
  } catch (err) {
    logger.error('Failed to instantiate OpenTelemetry NodeSDK', err);
  }
} else {
  logger.info('OpenTelemetry Tracing is disabled by default to secure rapid TCP port startup liveness.');
}

export const initTracing = () => {
  if (!sdk) {
    logger.info('Bypassing trace SDK initialization (Trace disabled)');
    return;
  }
  try {
    sdk.start();
    logger.info('OpenTelemetry SDK started successfully');
  } catch (error) {
    logger.error('Failed to start OpenTelemetry SDK', error);
  }
};

process.on('SIGTERM', () => {
  if (sdk) {
    sdk.shutdown()
      .then(() => logger.info('Tracing terminated'))
      .catch((error) => logger.error('Error terminating tracing', error));
  }
});

