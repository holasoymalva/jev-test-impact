import { describe, expect, it } from "vitest";
import type { Candidate } from "../src/core/types.js";
import { JevClient } from "../src/jev/client.js";
import {
  createFakeDecisionEngine,
  JevDecisionEngine,
} from "../src/jev/engine.js";
import { parseRemoteScores } from "../src/jev/schemas.js";

describe("Jev boundary", () => {
  it("validates structured scores", () => {
    expect(
      parseRemoteScores({ answers: { "001": { type: "noul", noul: 0.8 } } }),
    ).toEqual([{ id: "001", score: 0.8 }]);
    expect(() =>
      parseRemoteScores({ answers: { "001": { noul: 2 } } }),
    ).toThrow();
  });
  it("provides deterministic fake scores", async () => {
    const engine = createFakeDecisionEngine({ "a.test.ts": 0.9 });
    const scores = await engine.scoreTests({
      changeSet: { baseRef: "main", headRef: "HEAD", files: [], packages: [] },
      candidates: [
        {
          id: "1",
          test: { id: "1", path: "a.test.ts", framework: "vitest" },
          staticScore: 0.3,
          relations: [],
          mandatory: false,
        },
      ],
    });
    expect(scores).toEqual([{ id: "1", score: 0.9 }]);
  });

  it("rejects IDs that were not present in the current batch", async () => {
    const fetchImpl = (async (
      _input: string | URL | Request,
      init?: RequestInit,
    ) => {
      const body = JSON.parse(String(init?.body));
      expect(body).toMatchObject({ model: "jev-latest" });
      expect(body.questions["1"].type).toBe("noul");
      return new Response(
        JSON.stringify({
          answers: {
            "1": { type: "noul", noul: 0.9 },
            "../../evil.test.ts": { type: "noul", noul: 1 },
          },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;
    const client = new JevClient({
      apiKey: "secret",
      baseUrl: "https://example.test",
      timeoutMs: 1000,
      fetchImpl,
    });
    const candidate: Candidate = {
      id: "1",
      test: { id: "1", path: "src/a.test.ts", framework: "vitest" },
      staticScore: 0.3,
      relations: ["same-directory"],
      mandatory: false,
    };
    const scores = await new JevDecisionEngine(client).scoreTests({
      changeSet: {
        baseRef: "main",
        headRef: "HEAD",
        files: [{ path: "src/a.ts", status: "modified" }],
        packages: [],
      },
      candidates: [candidate],
    });
    expect(scores).toEqual([{ id: "1", score: 0.9 }]);
  });
});
