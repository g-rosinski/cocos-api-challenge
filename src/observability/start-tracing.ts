import { Logger } from '@nestjs/common';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

let sdk: NodeSDK | undefined;

export function startTracing(): void {
  try {
    const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
    const hasExporter = endpoint !== undefined && endpoint.length > 0;
    const configuration: ConstructorParameters<typeof NodeSDK>[0] = {
      serviceName: process.env.OTEL_SERVICE_NAME ?? 'cocos-api-challenge',
      instrumentations: [],
    };
    if (hasExporter) {
      configuration.traceExporter = new OTLPTraceExporter();
    }
    sdk = new NodeSDK(configuration);
    sdk.start();
    const message = hasExporter
      ? 'OpenTelemetry SDK started with OTLP trace export'
      : 'OpenTelemetry SDK started without trace exporter';
    Logger.log(message, 'Tracing');
  } catch (error: unknown) {
    Logger.error('OpenTelemetry SDK failed to start', String(error), 'Tracing');
  }
}
