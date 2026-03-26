# session/

Persistent AI sessions with schema caching, job queue, and Claude Code integration.

## What It Provides

**`SessionManager`** -- Manages the full AI session lifecycle on the filesystem (`.specverse/sessions/`):
- `create(options)` -- Initialize a new session with schema pre-loading via Claude Code. Returns `SessionInfo` with UUID session ID.
- `submit(request)` -- Queue a `JobRequest` (create/analyse/materialise/realize) against an active session.
- `processJob(jobId)` -- Dequeue and execute a job by resuming the Claude Code session with a generated prompt. Updates job status through queued -> processing -> completed/failed.
- `status(jobId)` -- Check job status from results or queue directories.
- `list(options)` / `delete(sessionId, options)` -- Session management with force-delete protection for pending jobs.

**`ClaudeExecutor`** -- Handles Claude Code binary execution:
- `initialize(options)` -- Starts a new Claude Code session with `--session-id`, `--add-dir` for schemas, and an init prompt that loads SpecVerse syntax into context.
- `resume(sessionId, prompt)` -- Resumes an existing session with `--resume` to reuse cached schema context (98% token savings).
- `isAvailable()` / `getVersion()` -- Claude Code binary detection.

**`types.ts`** -- All session type definitions: `SessionInfo`, `JobRequest`, `JobStatus`, `JobResult` (with validation/inference/token stats), `QueueItem`, `ClaudeInitOptions`, `ClaudeExecuteOptions`, `ServerConfig`, `ServerStatus`.

## Position in the AI Engine

This is the **persistent execution layer**. While the orchestrator handles single-request workflows, the session manager enables long-lived sessions where schemas are loaded once and reused across multiple generation jobs via Claude Code's `--resume` flag.

## Exports

```typescript
export { SessionManager, ClaudeExecutor }
export type { SessionInfo, JobRequest, JobStatus, JobResult, QueueItem, ... }
```
