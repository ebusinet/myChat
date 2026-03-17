import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/storage/prisma.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['@prisma/client'],
});
