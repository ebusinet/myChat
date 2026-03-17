import { z } from 'zod';
import { contextSnapshotSchema } from './context.schema.js';

export const sendMessageSchema = z.object({
  sessionId: z.string().min(1),
  parentId: z.string().nullable(),
  content: z.string().min(1).max(32_000),
  context: contextSnapshotSchema,
});

export const editMessageSchema = z.object({
  sessionId: z.string().min(1),
  originalMessageId: z.string().min(1),
  content: z.string().min(1).max(32_000),
  context: contextSnapshotSchema,
});

export const createSessionSchema = z.object({
  title: z.string().max(200).optional(),
  context: contextSnapshotSchema.optional(),
});
