
import { Logger } from './logger';

const logger = new Logger({ service: "Tracing" });

const isTracingEnabled = process.env.ENABLE_TRACING === "true" || !!process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

/**
 * Svet Gradjevine - Distributed Tracing Initialization
 */
let sdk: any = null;

export const initTracing = async () => {
  if (!isTracingEnabled) {
    logger.info('Bypassing trace SDK initialization (Trace disabled)');
    return;
  }
  
  try {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-proto');
    const { resourceFromAttributes } = await import('@opentelemetry/resources');
    
    // In @opentelemetry/semantic-conventions v1.x / v2.x attributes might be different, let's construct manually
    const serviceNameAttr = 'service.name';
    const envAttr = 'deployment.environment';

    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [serviceNameAttr]: 'svet-gradjevine-backend',
        [envAttr]: process.env.NODE_ENV || 'development',
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
      .catch((err: any) => console.warn('[Tracing] Terminate error:', err));
  }
});


