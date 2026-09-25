import { defineConfig, loadConfig } from "./config/config.js";
import type { UserConfig } from "./config/schema.js";
import { selectImpactedTestsInternal } from "./impact/index.js";
import { JevClient } from "./jev/client.js";
import { JevDecisionEngine } from "./jev/engine.js";
import { runTests } from "./runner/executor.js";

export type { ResolvedConfig, UserConfig } from "./config/schema.js";
export type * from "./core/types.js";
export {
  createFakeDecisionEngine,
  JevDecisionEngine,
  RulesDecisionEngine,
} from "./jev/engine.js";
export { defineConfig };

export interface PublicOptions extends UserConfig {
  root?: string;
  static?: boolean;
  full?: boolean;
  signal?: AbortSignal;
}

export async function selectImpactedTests(options: PublicOptions = {}) {
  const root = options.root ?? process.cwd();
  const config = await loadConfig(root, options);
  const apiKey = process.env.TYPESAFE_API_KEY;
  const staticMode = options.static || !apiKey;
  const model = config.jev.model ?? process.env.JEV_MODEL;
  const engine = apiKey
    ? new JevDecisionEngine(
        new JevClient({
          apiKey,
          baseUrl:
            config.jev.baseUrl ??
            process.env.JEV_BASE_URL ??
            "https://api.typesafe.ai",
          ...(model ? { model } : {}),
          timeoutMs: config.jev.timeoutMs,
        }),
        config.jev.batchSize,
      )
    : undefined;
  return await selectImpactedTestsInternal({
    root,
    config,
    ...(config.base ? { base: config.base } : {}),
    ...(engine ? { engine } : {}),
    ...(staticMode ? { static: true } : {}),
    ...(options.full ? { full: true } : {}),
    ...(options.signal ? { signal: options.signal } : {}),
  });
}

export async function runImpactedTests(options: PublicOptions = {}) {
  const root = options.root ?? process.cwd();
  const selection = await selectImpactedTests(options);
  const result = await runTests(
    root,
    selection.selected.map((item) => item.test),
    selection.fullSuite,
    options.signal,
  );
  return { selection, result };
}
