/**
 * SessionManager
 * Manages AI session lifecycle, queue, and job processing
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { ClaudeExecutor } from './claude-executor.js';
import type {
  SessionInfo,
  JobRequest,
  JobStatus,
  QueueItem,
  SessionManagerConfig,
  CreateSessionOptions,
  DeleteSessionOptions,
  ListSessionsOptions
} from './types.js';

export class SessionManager {
  private sessionsDir: string;
  private config: SessionManagerConfig;
  private executor: ClaudeExecutor;

  constructor(workDir: string = '.specverse/sessions', config?: SessionManagerConfig) {
    this.sessionsDir = workDir;
    this.config = config || {};
    this.executor = new ClaudeExecutor(config?.claude);
    this.ensureDirectories();
  }

  /**
   * Ensure all required directories exist
   */
  private ensureDirectories(): void {
    const dirs = ['active', 'queue', 'results', 'logs'];
    dirs.forEach(dir => {
      const path = join(this.sessionsDir, dir);
      if (!existsSync(path)) {
        mkdirSync(path, { recursive: true });
      }
    });
  }

  /**
   * Create a new AI session with schema caching
   */
  async create(options: CreateSessionOptions = {}): Promise<SessionInfo> {
    // 1. Generate session ID
    const sessionId = this.generateSessionId();

    // 2. Initialize Claude Code session with schemas
    try {
      await this.executor.initialize({
        sessionId,
        pver: options.pver || 'default',
        loadSchemas: true
      });
    } catch (error: any) {
      throw new Error(`Failed to create session: ${error.message}`);
    }

    // 3. Create session metadata
    const session: SessionInfo = {
      sessionId,
      name: options.name,
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      pver: options.pver || 'default',
      schemasLoaded: true,
      jobsProcessed: 0,
      status: 'active'
    };

    // 4. Save to filesystem
    this.saveSession(session);

    return session;
  }

  /**
   * Submit AI generation request to session queue
   */
  async submit(request: JobRequest): Promise<JobStatus> {
    // 1. Validate session exists
    const session = this.loadSession(request.sessionId);
    if (!session) {
      throw new Error(`Session not found: ${request.sessionId}`);
    }

    // 2. Create job status
    const job: JobStatus = {
      jobId: request.jobId,
      sessionId: request.sessionId,
      status: 'queued',
      submitted: new Date().toISOString()
    };

    // 3. Add to queue
    const queueItem: QueueItem = {
      id: request.jobId,
      sessionId: request.sessionId,
      request,
      timestamp: Date.now()
    };

    this.saveQueueItem(queueItem);

    return job;
  }

  /**
   * Get status of a job
   */
  async status(jobId: string): Promise<JobStatus> {
    // Check results first (completed jobs)
    const resultPath = join(this.sessionsDir, 'results', `${jobId}.json`);
    if (existsSync(resultPath)) {
      const content = readFileSync(resultPath, 'utf8');
      return JSON.parse(content) as JobStatus;
    }

    // Check queue (pending jobs)
    const queuePath = join(this.sessionsDir, 'queue', `${jobId}.json`);
    if (existsSync(queuePath)) {
      const content = readFileSync(queuePath, 'utf8');
      const item = JSON.parse(content) as QueueItem;
      return {
        jobId,
        sessionId: item.sessionId,
        status: 'queued',
        submitted: new Date(item.timestamp).toISOString()
      };
    }

    throw new Error(`Job not found: ${jobId}`);
  }

  /**
   * Process a job from the queue
   */
  async processJob(jobId: string): Promise<JobStatus> {
    // 1. Load queue item
    const queuePath = join(this.sessionsDir, 'queue', `${jobId}.json`);
    if (!existsSync(queuePath)) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const queueItem = JSON.parse(readFileSync(queuePath, 'utf8')) as QueueItem;
    const { request } = queueItem;

    // 2. Update job status to processing
    const job: JobStatus = {
      jobId: request.jobId,
      sessionId: request.sessionId,
      status: 'processing',
      submitted: new Date(queueItem.timestamp).toISOString(),
      started: new Date().toISOString()
    };

    try {
      // 3. Build prompt based on operation
      const prompt = this.buildJobPrompt(request);

      // 4. Resume Claude Code session
      const result = await this.executor.resume(request.sessionId, prompt);

      // 5. Update job as completed
      job.status = 'completed';
      job.completed = new Date().toISOString();
      job.result = {
        output: request.output,
        data: result
      };

      // 6. Update session stats
      this.updateSessionActivity(request.sessionId);
      const session = this.loadSession(request.sessionId);
      if (session) {
        session.jobsProcessed++;
        this.saveSession(session);
      }
    } catch (error: any) {
      // Handle failure
      job.status = 'failed';
      job.completed = new Date().toISOString();
      job.error = error.message;
    }

    // 7. Save result and remove from queue
    this.saveJobResult(job);
    unlinkSync(queuePath);

    return job;
  }

  /**
   * Build Claude Code prompt for a job
   */
  private buildJobPrompt(request: JobRequest): string {
    let prompt = `You are generating a SpecVerse specification.\n\n`;
    prompt += `**Operation**: ${request.operation}\n`;
    prompt += `**Requirements**: ${request.requirements}\n\n`;

    if (request.output) {
      prompt += `**Output File**: ${request.output}\n\n`;
    }

    if (request.options) {
      prompt += `**Options**: ${JSON.stringify(request.options, null, 2)}\n\n`;
    }

    prompt += `Please generate the specification according to these requirements.\n`;
    prompt += `Use SpecVerse v3.4+ syntax loaded in your context.`;

    return prompt;
  }

  /**
   * Save job result to filesystem
   */
  private saveJobResult(job: JobStatus): void {
    const path = join(this.sessionsDir, 'results', `${job.jobId}.json`);
    writeFileSync(path, JSON.stringify(job, null, 2), 'utf8');
  }

  /**
   * List all sessions
   */
  async list(options: ListSessionsOptions = {}): Promise<SessionInfo[]> {
    const activePath = join(this.sessionsDir, 'active');

    if (!existsSync(activePath)) {
      return [];
    }

    const files = readdirSync(activePath).filter(f => f.endsWith('.json'));

    const sessions = files.map(f => {
      const content = readFileSync(join(activePath, f), 'utf8');
      return JSON.parse(content) as SessionInfo;
    });

    // Filter by status if not showing all
    if (!options.all) {
      return sessions.filter(s => s.status === 'active');
    }

    return sessions;
  }

  /**
   * Delete a session
   */
  async delete(sessionId: string, options: DeleteSessionOptions = {}): Promise<void> {
    // 1. Check for pending jobs
    if (!options.force) {
      const pending = this.getPendingJobs(sessionId);
      if (pending.length > 0) {
        throw new Error(`Session has ${pending.length} pending jobs. Use --force to delete anyway.`);
      }
    }

    // 2. Delete session file
    const sessionPath = join(this.sessionsDir, 'active', `${sessionId}.json`);
    if (existsSync(sessionPath)) {
      unlinkSync(sessionPath);
    }

    // 3. Cleanup queue items for this session
    const queueDir = join(this.sessionsDir, 'queue');
    if (existsSync(queueDir)) {
      const queueFiles = readdirSync(queueDir);
      queueFiles.forEach(file => {
        const filePath = join(queueDir, file);
        const content = readFileSync(filePath, 'utf8');
        const item = JSON.parse(content) as QueueItem;
        if (item.sessionId === sessionId) {
          unlinkSync(filePath);
        }
      });
    }
  }

  /**
   * Generate a unique session ID (UUID format required by Claude Code)
   */
  private generateSessionId(): string {
    return randomUUID();
  }

  /**
   * Save session metadata to filesystem
   */
  private saveSession(session: SessionInfo): void {
    const path = join(this.sessionsDir, 'active', `${session.sessionId}.json`);
    writeFileSync(path, JSON.stringify(session, null, 2), 'utf8');
  }

  /**
   * Load session metadata from filesystem
   */
  private loadSession(sessionId: string): SessionInfo | null {
    const path = join(this.sessionsDir, 'active', `${sessionId}.json`);
    if (!existsSync(path)) {
      return null;
    }
    const content = readFileSync(path, 'utf8');
    return JSON.parse(content) as SessionInfo;
  }

  /**
   * Save queue item to filesystem
   */
  private saveQueueItem(item: QueueItem): void {
    const path = join(this.sessionsDir, 'queue', `${item.id}.json`);
    writeFileSync(path, JSON.stringify(item, null, 2), 'utf8');
  }

  /**
   * Get all pending jobs for a session
   */
  private getPendingJobs(sessionId: string): QueueItem[] {
    const queueDir = join(this.sessionsDir, 'queue');

    if (!existsSync(queueDir)) {
      return [];
    }

    const files = readdirSync(queueDir).filter(f => f.endsWith('.json'));

    return files
      .map(f => {
        const content = readFileSync(join(queueDir, f), 'utf8');
        return JSON.parse(content) as QueueItem;
      })
      .filter(item => item.sessionId === sessionId);
  }

  /**
   * Update session last activity timestamp
   */
  private updateSessionActivity(sessionId: string): void {
    const session = this.loadSession(sessionId);
    if (session) {
      session.lastActivity = new Date().toISOString();
      this.saveSession(session);
    }
  }
}
