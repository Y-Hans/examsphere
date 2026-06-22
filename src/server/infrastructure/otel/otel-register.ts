import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { env } from '@/lib/env';
import { logger } from '@/server/shared/logger';

const log = logger.child({ module: 'OTEL' });

let sdk: NodeSDK | undefined;

export async function register() {
  if (!env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    log.info('OTEL endpoint not configured. Skipping instrumentation.');
    return;
  }

  if (sdk) {
    return;
  }

  const traceExporter = new OTLPTraceExporter({
    url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
  });

  sdk = new NodeSDK({
    traceExporter,
    serviceName: env.OTEL_SERVICE_NAME,
  });

  try {
    sdk.start();
    log.info('OpenTelemetry instrumentation started successfully.');
  } catch (error) {
    log.error({ error }, 'Failed to start OpenTelemetry instrumentation.');
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk?.shutdown();
});
