/**
 * Session Management Types
 * Type definitions for AI session management with schema caching
 */

/**
 * Session information and metadata
 */
export interface SessionInfo {
  sessionId: string;
  name?: string;
  created: string;
  lastActivity: string;
  pver: string;
  schemasLoaded: boolean;
  jobsProcessed: number;
  status: 'active' | 'inactive';
  stats?: {
    totalTokensSaved: number;
    averageJobTime: number;
  };
}

/**
 * Job request to be queued
 */
export interface JobRequest {
  jobId: string;
  sessionId: string;
  operation: 'create' | 'analyse' | 'materialise' | 'realize';
  requirements: string;
  output?: string;
  options?: Record<string, any>;
}

/**
 * Job status and results
 */
export interface JobStatus {
  jobId: string;
  sessionId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  submitted: string;
  started?: string;
  completed?: string;
  duration?: string;
  error?: string;
  result?: JobResult;
}

/**
 * Job result details
 */
export interface JobResult {
  output?: string;
  data?: any;
  file?: string;
  lines?: number;
  validation?: 'passed' | 'failed';
  inference?: {
    input: number;
    output: number;
    ratio: string;
    time?: string;
  };
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
    savings: number;
  };
}

/**
 * Queue item stored in filesystem
 */
export interface QueueItem {
  id: string;
  sessionId: string;
  request: JobRequest;
  timestamp: number;
}

/**
 * Session manager configuration
 */
export interface SessionManagerConfig {
  workDir?: string;
  claude?: {
    claudeBin?: string;
    schemaDir?: string;
  };
}

/**
 * Options for creating a new session
 */
export interface CreateSessionOptions {
  pver?: string;
  name?: string;
}

/**
 * Options for deleting a session
 */
export interface DeleteSessionOptions {
  force?: boolean;
}

/**
 * Options for listing sessions
 */
export interface ListSessionsOptions {
  all?: boolean;
}

/**
 * Options for following job status
 */
export interface StatusOptions {
  follow?: boolean;
  interval?: number;
}

/**
 * Claude Code initialization options
 */
export interface ClaudeInitOptions {
  sessionId: string;
  pver: string;
  loadSchemas: boolean;
}

/**
 * Claude Code execution options
 */
export interface ClaudeExecuteOptions {
  sessionId: string;
  prompt: string;
  addDirs?: string[];
  resume?: boolean;
  print?: boolean;
  json?: boolean;
}

/**
 * Server daemon configuration
 */
export interface ServerConfig {
  pver?: string;
  port?: number;
  pollInterval?: number;
}

/**
 * Server status information
 */
export interface ServerStatus {
  running: boolean;
  pid?: number;
  sessionId?: string;
  started?: string;
  jobsProcessed?: number;
}
