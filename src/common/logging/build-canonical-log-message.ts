export type BuildCanonicalLogMessageInput = {
  title: string;
  status?: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

export function buildCanonicalLogMessage(
  input: BuildCanonicalLogMessageInput,
): string {
  const requestSummary = `${input.method} ${input.path} -> ${input.statusCode} ${input.durationMs}ms`;
  const statusSegment =
    input.status !== undefined && input.status.length > 0
      ? ` [${input.status}]`
      : '';
  return `${input.title}${statusSegment} - ${requestSummary}`;
}

export function buildDefaultCanonicalTitle(
  method: string,
  path: string,
): string {
  return `${method} ${path}`;
}
