import { z } from "zod";

export const remoteAnswerSchema = z.object({
  type: z.string().optional(),
  noul: z.number().min(0).max(1),
});
export const remoteScoresSchema = z.object({
  answers: z.record(z.string(), remoteAnswerSchema),
});

export function parseRemoteScores(
  value: unknown,
): Array<{ id: string; score: number }> {
  const parsed = remoteScoresSchema.parse(value);
  return Object.entries(parsed.answers).map(([id, answer]) => ({
    id,
    score: answer.noul,
  }));
}
