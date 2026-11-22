// GHL DevOps Toolkit - Shared TypeScript Types

export type AuthType = "oauth" | "private_token";
export type ConnectionStatus = "active" | "expired" | "error" | "demo";

export interface GhlConnection {
  id: string;
  name: string;
  locationId: string;
  authType: AuthType;
  accessToken: string;
  refreshToken?: string | null;
  tokenExpiresAt?: string | null;
  apiVersion: string;
  scopes?: string | null;
  status: ConnectionStatus;
  lastVerifiedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequest {
  id: string;
  connectionId: string;
  method: HttpMethod;
  endpoint: string;
  headers: Record<string, string>;
  body?: string | null;
  queryParams?: Record<string, string> | null;
  statusCode?: number | null;
  responseHeaders?: Record<string, string> | null;
  responseBody?: string | null;
  durationMs?: number | null;
  status: "pending" | "success" | "error";
  errorMessage?: string | null;
  isSaved: boolean;
  savedName?: string | null;
  createdAt: string;
}

export interface WebhookEvent {
  id: string;
  connectionId?: string | null;
  endpoint: string;
  eventType: string;
  headers: Record<string, string>;
  body: string;
  parsedBody?: string | null;
  signature?: string | null;
  signatureValid?: boolean | null;
  sourceIp?: string | null;
  replayCount: number;
  createdAt: string;
}

export type WorkflowScenario =
  | "new_lead"
  | "contact_updated"
  | "pipeline_stage_changed"
  | "appointment_booked"
  | "appointment_cancelled"
  | "form_submitted"
  | "follow_up_triggered";

export interface WorkflowStep {
  id: string;
  name: string;
  type: "trigger" | "action" | "wait" | "condition" | "notification";
  description: string;
  status?: "pending" | "success" | "failed" | "skipped";
  result?: string;
}

export interface WorkflowSim {
  id: string;
  name: string;
  scenario: WorkflowScenario;
  contactPayload: Record<string, unknown>;
  expectedSteps: WorkflowStep[];
  executedSteps?: WorkflowStep[] | null;
  status: "draft" | "passed" | "failed" | "partial";
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestCase {
  id: string;
  suiteId?: string | null;
  name: string;
  description?: string | null;
  inputPayload: Record<string, unknown>;
  expectedOutput?: Record<string, unknown> | null;
  assertions: Assertion[];
  tags?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assertion {
  id: string;
  field: string; // json path like "data.id"
  operator: "equals" | "exists" | "not_null" | "contains" | "greater_than" | "less_than";
  expected?: string;
}

export interface TestSuite {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TestRun {
  id: string;
  caseId?: string | null;
  suiteId?: string | null;
  connectionId?: string | null;
  name: string;
  status: "passed" | "failed" | "skipped" | "error";
  assertionsRun: number;
  assertionsPassed: number;
  failures?: Failure[] | null;
  durationMs?: number | null;
  output?: string | null;
  simulated: boolean;
  createdAt: string;
}

export interface Failure {
  assertionId: string;
  field: string;
  expected: string;
  actual: string;
  message: string;
}

export interface SnapshotReport {
  id: string;
  fileName: string;
  fileSize: number;
  snapshotJson: string;
  summary: SnapshotSummary;
  issues: SnapshotIssue[];
  status: "valid" | "warnings" | "invalid";
  importReady: boolean;
  createdAt: string;
}

export interface SnapshotSummary {
  totalEntities: number;
  workflows: number;
  pipelines: number;
  calendars: number;
  forms: number;
  customFields: number;
  tags: number;
}

export interface SnapshotIssue {
  level: "error" | "warning" | "info";
  category: string;
  message: string;
  path?: string;
}

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface AiSession {
  id: string;
  title: string;
  model: string;
  context?: string | null;
  messages: AiMessage[];
  tokenUsage: number;
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheck {
  id: string;
  connectionId: string;
  endpoint: string;
  method: HttpMethod;
  statusCode?: number | null;
  responseTimeMs?: number | null;
  ok: boolean;
  errorMessage?: string | null;
  checkedAt: string;
}

export interface AlertConfig {
  id: string;
  name: string;
  type: "error_rate" | "latency" | "webhook_failure";
  threshold: number;
  enabled: boolean;
  lastTriggered?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  title: string;
  type: ReportType;
  format: "html" | "json" | "csv" | "pdf";
  content: string;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export type ReportType =
  | "api_diagnostics"
  | "testing_results"
  | "webhook_history"
  | "integration_health"
  | "full_summary";

export interface AuditLog {
  id: string;
  action: string;
  actor: string;
  resourceType?: string | null;
  resourceId?: string | null;
  connectionId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

// ============================================================
// API Response wrappers
// ============================================================
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ============================================================
// Navigation
// ============================================================
export type ModuleId =
  | "overview"
  | "connections"
  | "api-explorer"
  | "webhooks"
  | "workflows"
  | "testing"
  | "snapshots"
  | "ai-debugger"
  | "monitor"
  | "reports"
  | "settings"
  | "docs";

export interface NavItem {
  id: ModuleId;
  label: string;
  description: string;
  icon: string; // lucide icon name
  group: "core" | "developer" | "advanced" | "system";
}
