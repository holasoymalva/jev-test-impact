import { access } from "node:fs/promises";
import { join } from "node:path";
import { createJiti } from "jiti";
import {
  configSchema,
  type ResolvedConfig,
  type UserConfig,
} from "./schema.js";

export function defineConfig(config: UserConfig): UserConfig {
  return config;
}

export async function loadConfig(
  root: string,
  override: UserConfig = {},
): Promise<ResolvedConfig> {
  let fileConfig: UserConfig = {};
  for (const name of [
    "jev-test-impact.config.ts",
    "jev-test-impact.config.mjs",
    "jev-test-impact.config.js",
  ]) {
    const file = join(root, name);
    try {
      await access(file);
      const loaded = await createJiti(import.meta.url).import(file, {
        default: true,
      });
      fileConfig = loaded as UserConfig;
      break;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return configSchema.parse({
    ...fileConfig,
    ...override,
    selection: { ...fileConfig.selection, ...override.selection },
    jev: { ...fileConfig.jev, ...override.jev },
  });
}

export function thresholdFor(config: ResolvedConfig): number {
  return (
    config.selection.threshold ??
    { safe: 0.4, balanced: 0.6, aggressive: 0.8 }[config.mode]
  );
}
