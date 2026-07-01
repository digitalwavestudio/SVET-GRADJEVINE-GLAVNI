import { Logger } from './logger';

const logger = new Logger({ service: "Tracing" });

export const initTracing = async () => {
  logger.info('Tracing disabled — OTEL not configured');
};

export function getTracer() {
  return { startSpan: () => ({ end: () => {} }) };
}
