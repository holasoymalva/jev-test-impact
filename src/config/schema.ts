import { z } from "zod";

export const configSchema = z.object({
  base: z.string().optional(),
  mode: z.enum(["safe", "balanced", "aggressive"]).default("safe"),
  selection: z
    .object({
      threshold: z.number().min(0).max(1).optional(),
      candidateThreshold: z.number().min(0).max(1).default(0.2),
    })
    .default({ candidateThreshold: 0.2 }),
  alwaysRun: z.array(z.string()).default([]),
  fallback: z.enum(["candidates", "full-suite", "error"]).default("candidates"),
  testPatterns: z.array(z.string()).optional(),
  ignore: z.array(z.string()).default([]),
  jev: z
    .object({
      baseUrl: z.string().url().optional(),
      model: z.string().optional(),
      batchSize: z.number().int().min(1).max(100).default(50),
      timeoutMs: z.number().int().min(100).default(10_000),
    })
    .default({ batchSize: 50, timeoutMs: 10_000 }),
});

export type UserConfig = z.input<typeof configSchema>;
export type ResolvedConfig = z.output<typeof configSchema>;
