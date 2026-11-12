import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    exclude: ['**/*.integration-spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'src/**/*.types.ts',
        'src/main.ts',
        'src/app.module.ts',
        'src/**/*.module.ts',
        'src/modules/health/**',
        'src/observability/start-tracing.ts',
        'src/database/migrations/**',
        'src/database/bootstrap-*.ts',
        'src/database/run-migrations.ts',
        'src/database/revert-migrations.ts',
        'src/database/data-source.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
});
