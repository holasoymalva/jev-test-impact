import { JevApiError } from "../core/errors.js";

export interface JevClientOptions {
  apiKey: string;
  baseUrl: string;
  model?: string;
  timeoutMs: number;
  fetchImpl?: typeof fetch;
}

export class JevClient {
  readonly #fetch: typeof fetch;
  constructor(private readonly options: JevClientOptions) {
    this.#fetch = options.fetchImpl ?? fetch;
  }

  async score(
    payload: {
      state: string;
      questions: Record<string, { type: "noul"; instructions: string }>;
    },
    signal?: AbortSignal,
  ): Promise<unknown> {
    const endpoint = `${this.options.baseUrl.replace(/\/$/, "")}/v1/systemone`;
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const timeout = AbortSignal.timeout(this.options.timeoutMs);
      const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
      try {
        const response = await this.#fetch(endpoint, {
          method: "POST",
          headers: {
            authorization: `Bearer ${this.options.apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: this.options.model ?? "jev-latest",
            state: payload.state,
            questions: payload.questions,
          }),
          signal: combined,
        });
        if (response.ok) return await response.json();
        const message = (await response.text()).slice(0, 500);
        if (response.status < 500 && response.status !== 429)
          throw new JevApiError(`Jev API ${response.status}: ${message}`);
        lastError = new JevApiError(`Jev API ${response.status}: ${message}`);
        if (attempt < 2) {
          const retryAfter = Number(response.headers.get("retry-after"));
          await new Promise((resolve) =>
            setTimeout(
              resolve,
              Number.isFinite(retryAfter) && retryAfter > 0
                ? retryAfter * 1000
                : 200 * 2 ** attempt,
            ),
          );
        }
      } catch (error) {
        if (
          error instanceof JevApiError &&
          !error.message.match(/API (429|5\d\d)/)
        )
          throw error;
        lastError = error;
        if (attempt < 2)
          await new Promise((resolve) =>
            setTimeout(resolve, 200 * 2 ** attempt),
          );
      }
    }
    throw new JevApiError(
      `Jev request failed: ${lastError instanceof Error ? lastError.message : "unknown error"}`,
    );
  }
}
