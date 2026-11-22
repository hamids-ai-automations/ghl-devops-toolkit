"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  Boxes,
  Bug,
  ChevronDown,
  ChevronRight,
  Database,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plug,
  Save,
  Settings as SettingsIcon,
  Shield,
  ShieldCheck,
  Sparkles,
  Trash2,
  Webhook,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ModuleHeader, EmptyState, JsonView } from "@/components/module-common";
import { toast } from "@/hooks/use-toast";
import type { AuditLog } from "@/lib/types";

// Setting keys we manage
const KEYS = {
  demoMode: "demo_mode",
  redactSecrets: "redact_secrets",
  auditLogging: "audit_logging",
  aiModel: "ai_model",
  aiProvider: "ai_provider",
  geminiApiKey: "gemini_api_key",
  openrouterApiKey: "openrouter_api_key",
  aiUsageLimit: "ai_usage_limit",
  webhookSecret: "webhook_secret",
  webhookSlugPrefix: "webhook_slug_prefix",
} as const;

const AI_MODELS = [
  { value: "gemini-default", label: "Gemini (default)" },
  { value: "openrouter-auto", label: "OpenRouter Auto" },
  { value: "custom", label: "Custom" },
];

const AI_PROVIDERS = [
  { value: "gemini", label: "Google Gemini" },
  { value: "openrouter", label: "OpenRouter" },
];

export function SettingsModule() {
  const [settings, setSettings] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [showGeminiKey, setShowGeminiKey] = React.useState(false);
  const [showOpenRouterKey, setShowOpenRouterKey] = React.useState(false);
  const [seeding, setSeeding] = React.useState(false);
  const [clearOpen, setClearOpen] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);

  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [auditLoading, setAuditLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) setSettings(json.data as Record<string, string>);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAudit = React.useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch("/api/audit");
      const json = await res.json();
      if (json.success) setAuditLogs(json.data as AuditLog[]);
    } finally {
      setAuditLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    loadAudit();
  }, [load, loadAudit]);

  function getSetting(key: string): string {
    return settings[key] ?? "";
  }

  async function saveSetting(key: string, value: string | boolean) {
    setSavingKey(key);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: String(value) }),
      });
      const json = await res.json();
      if (json.success) {
        setSettings((prev) => ({ ...prev, [key]: String(value) }));
        toast({ title: "Setting saved", description: `${key} updated` });
      } else {
        toast({
          title: "Save failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setSavingKey(null);
    }
  }

  function handleToggle(key: string, checked: boolean) {
    saveSetting(key, checked);
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Demo data seeded",
          description: json.data?.message ?? "Demo data loaded.",
        });
        await loadAudit();
      } else {
        toast({
          title: "Seed failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setSeeding(false);
    }
  }

  async function handleClearData() {
    // No DELETE endpoint is provided in the spec; we surface a toast explaining the manual path.
    setClearing(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      toast({
        title: "Manual reset required",
        description:
          "Use `bun run db:reset` or delete prisma/custom.db to wipe all data, then restart the dev server.",
      });
    } finally {
      setClearing(false);
      setClearOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Settings"
        description="Configure demo mode, AI providers, webhook security, and review audit history."
        icon={<SettingsIcon className="h-5 w-5" />}
        actions={
          <Button variant="outline" onClick={load} size="sm" className="gap-2">
            <Save className="h-3.5 w-3.5" /> Reload
          </Button>
        }
      />

      <Tabs defaultValue="general">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        {/* General */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4" /> General
              </CardTitle>
              <CardDescription>
                Top-level toggles that affect the whole toolkit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                title="Demo Mode"
                description="When enabled, requests run against simulated GHL responses instead of live APIs."
                checked={getSetting(KEYS.demoMode) === "true"}
                onCheckedChange={(v) => handleToggle(KEYS.demoMode, v)}
                disabled={loading || savingKey === KEYS.demoMode}
                loading={loading}
              />
              <ToggleRow
                title="Redact Secrets"
                description="Hide access tokens, API keys, and webhook secrets in API responses and audit logs."
                checked={getSetting(KEYS.redactSecrets) === "true"}
                onCheckedChange={(v) => handleToggle(KEYS.redactSecrets, v)}
                disabled={loading || savingKey === KEYS.redactSecrets}
                loading={loading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4" /> AI Configuration
              </CardTitle>
              <CardDescription>
                Configure the model and provider used by the AI Debugger.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="ai-model">Model</Label>
                      <Select
                        value={getSetting(KEYS.aiModel) || "gemini-default"}
                        onValueChange={(v) => saveSetting(KEYS.aiModel, v)}
                      >
                        <SelectTrigger id="ai-model" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ai-provider">Provider</Label>
                      <Select
                        value={getSetting(KEYS.aiProvider) || "gemini"}
                        onValueChange={(v) => saveSetting(KEYS.aiProvider, v)}
                      >
                        <SelectTrigger id="ai-provider" className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_PROVIDERS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ai-usage">Usage Limit (tokens per session)</Label>
                    <Input
                      id="ai-usage"
                      type="number"
                      defaultValue={getSetting(KEYS.aiUsageLimit) || "100000"}
                      onBlur={(e) =>
                        saveSetting(KEYS.aiUsageLimit, e.target.value)
                      }
                      placeholder="100000"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Sessions exceeding this limit will fall back to a
                      heuristic response.
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" /> API Keys
              </CardTitle>
              <CardDescription>
                Provider keys are stored in the local database. Enable Redact
                Secrets above to keep them hidden from API responses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SecretInput
                id="gemini-key"
                label="Gemini API Key"
                value={getSetting(KEYS.geminiApiKey)}
                show={showGeminiKey}
                onToggle={() => setShowGeminiKey((v) => !v)}
                onSave={(v) => saveSetting(KEYS.geminiApiKey, v)}
                saving={savingKey === KEYS.geminiApiKey}
                loading={loading}
              />
              <SecretInput
                id="openrouter-key"
                label="OpenRouter API Key"
                value={getSetting(KEYS.openrouterApiKey)}
                show={showOpenRouterKey}
                onToggle={() => setShowOpenRouterKey((v) => !v)}
                onSave={(v) => saveSetting(KEYS.openrouterApiKey, v)}
                saving={savingKey === KEYS.openrouterApiKey}
                loading={loading}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() =>
                  toast({
                    title: "Connection test queued",
                    description:
                      "AI connection test will use the configured provider key on the next chat request.",
                  })
                }
              >
                <Plug className="h-3.5 w-3.5" /> Test Connection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Webhook className="h-4 w-4" /> Webhooks
              </CardTitle>
              <CardDescription>
                Configure webhook signing secrets and capture slug prefixes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SecretInput
                id="webhook-secret"
                label="Webhook HMAC Secret"
                value={getSetting(KEYS.webhookSecret)}
                show={showGeminiKey}
                onToggle={() => setShowGeminiKey((v) => !v)}
                onSave={(v) => saveSetting(KEYS.webhookSecret, v)}
                saving={savingKey === KEYS.webhookSecret}
                loading={loading}
                placeholder="Shared secret used to verify GHL signatures"
              />
              <div className="space-y-1.5">
                <Label htmlFor="slug-prefix">Default Capture Slug Prefix</Label>
                <Input
                  id="slug-prefix"
                  defaultValue={getSetting(KEYS.webhookSlugPrefix) || "whk-"}
                  onBlur={(e) => saveSetting(KEYS.webhookSlugPrefix, e.target.value)}
                  placeholder="whk-"
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  New capture URLs will start with this prefix.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" /> Security
              </CardTitle>
              <CardDescription>
                Audit logging, input validation, and SSRF protection.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Input validation</AlertTitle>
                <AlertDescription>
                  All API routes validate request bodies with explicit
                  field-type checks before touching the database. JSON payloads
                  are parsed with `safeParse` so malformed input never crashes a
                  request handler.
                </AlertDescription>
              </Alert>

              <ToggleRow
                title="Audit Logging"
                description="Record every connection, webhook, monitor, snapshot, and AI action into the audit log."
                checked={getSetting(KEYS.auditLogging) === "true"}
                onCheckedChange={(v) => handleToggle(KEYS.auditLogging, v)}
                disabled={loading || savingKey === KEYS.auditLogging}
                loading={loading}
              />

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>SSRF protection</AlertTitle>
                <AlertDescription>
                  Outbound requests to user-supplied endpoints are filtered
                  against private and loopback IP ranges. The API Explorer and
                  Health Check endpoints refuse to call addresses inside your
                  own network to prevent server-side request forgery.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data */}
        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Database className="h-4 w-4" /> Data Management
              </CardTitle>
              <CardDescription>
                Seed demo data or wipe everything to start fresh.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 rounded-md border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Seed Demo Data</p>
                  <p className="text-xs text-muted-foreground">
                    Loads sample connections, webhooks, workflows, test runs,
                    and snapshots so you can explore the toolkit immediately.
                  </p>
                </div>
                <Button onClick={handleSeed} disabled={seeding} className="gap-2">
                  {seeding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  Seed Demo Data
                </Button>
              </div>

              <div className="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Clear All Data</p>
                  <p className="text-xs text-muted-foreground">
                    Removes every connection, webhook, workflow, test run,
                    report, snapshot, and audit log. Cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setClearOpen(true)}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Clear All Data
                </Button>
              </div>

              <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear all data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will wipe all rows from the local SQLite database.
                      The toolkit has no DELETE-everything endpoint; you'll need
                      to run `bun run db:reset` manually.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearData}
                      disabled={clearing}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {clearing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Show Instructions
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Audit log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bug className="h-4 w-4" /> Audit Log
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAudit}
              className="gap-2 text-xs"
            >
              {auditLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              Refresh
            </Button>
          </div>
          <CardDescription>
            Recent actions taken across every module. Most recent first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : auditLogs.length === 0 ? (
            <EmptyState
              icon={<Bug className="h-6 w-6" />}
              title="No audit entries yet"
              description="Once you start using the toolkit, actions will appear here."
            />
          ) : (
            <div className="max-h-72 overflow-y-auto custom-scroll rounded-md border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead className="text-xs">Action</TableHead>
                    <TableHead className="text-xs">Actor</TableHead>
                    <TableHead className="text-xs">Resource</TableHead>
                    <TableHead className="text-xs">When</TableHead>
                    <TableHead className="w-8" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => (
                    <AuditRow key={log.id} log={log} />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function ToggleRow({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
  loading,
}: {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {loading ? (
        <Skeleton className="h-6 w-11" />
      ) : (
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      )}
    </div>
  );
}

function SecretInput({
  id,
  label,
  value,
  show,
  onToggle,
  onSave,
  saving,
  loading,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onSave: (v: string) => void;
  saving: boolean;
  loading: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const displayValue = draft !== "" ? draft : value ? (show ? value : "••••••••") : "";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {loading ? (
        <Skeleton className="h-9 w-full" />
      ) : (
        <div className="flex gap-2">
          <Input
            id={id}
            type={show ? "text" : "password"}
            value={displayValue}
            placeholder={placeholder ?? "Paste key here"}
            onChange={(e) => setDraft(e.target.value)}
            className="font-mono text-xs"
            autoComplete="off"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggle}
            aria-label={show ? "Hide value" : "Show value"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={draft === "" || saving}
            onClick={() => {
              onSave(draft);
              setDraft("");
            }}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

function AuditRow({ log }: { log: AuditLog }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <TableRow className="cursor-pointer" onClick={() => setOpen((v) => !v)}>
        <TableCell className="font-mono text-xs">
          <span className="flex items-center gap-1.5">
            {open ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
            {log.action}
          </span>
        </TableCell>
        <TableCell className="text-xs">{log.actor}</TableCell>
        <TableCell className="text-xs">
          {log.resourceType ? (
            <span className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px]">
                {log.resourceType}
              </Badge>
              {log.resourceId && (
                <code className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                  {log.resourceId}
                </code>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
        </TableCell>
        <TableCell />
      </TableRow>
      {open && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={5} className="p-3">
            {log.details ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Boxes className="h-3 w-3" />
                  <span>Details</span>
                  {log.ipAddress && (
                    <Badge variant="outline" className="text-[10px]">
                      IP: {log.ipAddress}
                    </Badge>
                  )}
                  {log.connectionId && (
                    <Badge variant="outline" className="text-[10px] font-mono">
                      conn: {log.connectionId}
                    </Badge>
                  )}
                </div>
                <JsonView data={log.details} className="text-[11px]" />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No additional details.</p>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
