import { z } from 'zod';

export const contextLayerTypeSchema = z.enum(['app', 'user', 'session', 'page', 'widget']);

export const contextLayerSchema: z.ZodType<{
  type: z.infer<typeof contextLayerTypeSchema>;
  id: string;
  name: string;
  description?: string;
  data: Record<string, unknown>;
  children?: z.infer<typeof contextLayerSchema>[];
}> = z.object({
  type: contextLayerTypeSchema,
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  data: z.record(z.unknown()),
  children: z.lazy(() => contextLayerSchema.array()).optional(),
});

export const contextSnapshotSchema = z.object({
  collectedAt: z.string().datetime(),
  layers: z.array(contextLayerSchema),
});
