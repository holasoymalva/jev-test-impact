import { spawn } from "node:child_process";
import { GitError } from "../core/errors.js";
import type { ChangedFile, ChangeSet, ChangeStatus } from "../core/types.js";

async function git(
  root: string,
  args: string[],
  signal?: AbortSignal,
): Promise<string> {
  return await new Promise((resolve, reject) => {
    const child = spawn("git", args, {
      cwd: root,
      shell: false,
      signal,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(stdout.trim())
        : reject(new GitError(`git ${args[0]} failed: ${stderr.trim()}`)),
    );
  });
}

function statusOf(code: string): ChangeStatus {
  if (code.startsWith("A")) return "added";
  if (code.startsWith("D")) return "deleted";
  if (code.startsWith("R")) return "renamed";
  return "modified";
}

export function parseNameStatus(output: string): ChangedFile[] {
  if (!output) return [];
  return output.split("\n").flatMap((line) => {
    const [status, first, second] = line.split("\t");
    if (!status || !first) return [];
    if (status.startsWith("R") && second)
      return [{ path: second, oldPath: first, status: "renamed" as const }];
    return [{ path: first, status: statusOf(status) }];
  });
}

export interface DiffOptions {
  root: string;
  base?: string;
  head?: string;
  signal?: AbortSignal;
}

export class GitDiffProvider {
  async resolveBase(
    root: string,
    explicit?: string,
    signal?: AbortSignal,
  ): Promise<string> {
    if (explicit) {
      await git(root, ["rev-parse", "--verify", explicit], signal);
      return explicit;
    }
    for (const ref of ["origin/main", "main"]) {
      try {
        return await git(root, ["merge-base", "HEAD", ref], signal);
      } catch {
        /* try the next safe default */
      }
    }
    try {
      return await git(root, ["rev-parse", "HEAD~1"], signal);
    } catch {
      return "HEAD";
    }
  }

  async getChangeSet(options: DiffOptions): Promise<ChangeSet> {
    const head = options.head ?? "HEAD";
    const base = await this.resolveBase(
      options.root,
      options.base,
      options.signal,
    );
    const committed = parseNameStatus(
      await git(
        options.root,
        ["diff", "--name-status", "--find-renames", base, head],
        options.signal,
      ),
    );
    const working =
      head === "HEAD"
        ? parseNameStatus(
            await git(
              options.root,
              ["diff", "--name-status", "--find-renames", "HEAD"],
              options.signal,
            ),
          )
        : [];
    const untracked =
      head === "HEAD"
        ? (
            await git(
              options.root,
              ["ls-files", "--others", "--exclude-standard"],
              options.signal,
            )
          )
            .split("\n")
            .filter(Boolean)
            .map((path) => ({ path, status: "added" as const }))
        : [];
    const byPath = new Map<string, ChangedFile>();
    for (const file of [...committed, ...working, ...untracked])
      byPath.set(file.path, file);
    return {
      baseRef: base,
      headRef: head,
      files: [...byPath.values()],
      packages: [],
    };
  }
}
