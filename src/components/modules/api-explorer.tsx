"use client";

import * as React from "react";
import {
  ChevronDown,
  Loader2,
  Plus,
  Send,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
import { cn } from "@/lib/utils";
import type { ApiRequest, GhlConnection, HttpMethod } from "@/lib/types";

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

const COMMON_ENDPOINTS = [
  "/contacts",
  "/contacts/{id}",
  "/opportunities",
  "/opportunities/search",
  "/pipelines",
  "/calendars/events",
  "/calendars",
  "/locations",
  "/users",
  "/custom-fields",
  "/tags",
  "/forms",
];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  POST: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  PUT: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30",
  PATCH: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30",
  DELETE: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30",
};

interface KvPair {
  id: string;
  key: string;
  value: string;
}

interface ExecuteResponse {
  id: string;
  statusCode: number;
  headers: Record<string, string>;
  body: string;
  durationMs: number;
  simulated: boolean;
  status: "pending" | "success" | "error";
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function ApiExplorerModule() {
  const [connections, setConnections] = React.useState<GhlConnection[]>([]);
  const [connLoading, setConnLoading] = React.useState(true);
  const [connectionId, setConnectionId] = React.useState<string>("");

  const [method, setMethod] = React.useState<HttpMethod>("GET");
  const [endpoint, setEndpoint] = React.useState("/contacts");
  const [headers, setHeaders] = React.useState<KvPair[]>([]);
  const [queryParams, setQueryParams] = React.useState<KvPair[]>([]);
  const [body, setBody] = React.useState("");
  const [bodyError, setBodyError] = React.useState<string | null>(null);
  const [saveName, setSaveName] = React.useState("");

  const [executing, setExecuting] = React.useState(false);
  const [response, setResponse] = React.useState<ExecuteResponse | null>(null);
  const [headersOpen, setHeadersOpen] = React.useState(false);

  const [history, setHistory] = React.useState<ApiRequest[]>([]);
  const [historyLoading, setHistoryLoading] = React.useState(true);
  const [deleteTarget, setDeleteTarget] = React.useState<ApiRequest | null>(null);

  // Load connections
  React.useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const list = json.data as GhlConnection[];
          setConnections(list);
          if (list.length > 0 && !connectionId) setConnectionId(list[0].id);
        }
      })
      .finally(() => setConnLoading(false));
  }, []);

  const loadHistory = React.useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/api-explorer/history");
      const json = await res.json();
      if (json.success) setHistory(json.data as ApiRequest[]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  function validateBody() {
    if (!body.trim()) {
      setBodyError(null);
      return true;
    }
    try {
      JSON.parse(body);
      setBodyError(null);
      return true;
    } catch (e) {
      setBodyError(e instanceof Error ? e.message : "Invalid JSON");
      return false;
    }
  }

  function addHeader() {
    setHeaders((h) => [...h, { id: uid(), key: "", value: "" }]);
  }
  function removeHeader(id: string) {
    setHeaders((h) => h.filter((x) => x.id !== id));
  }
  function updateHeader(id: string, field: "key" | "value", value: string) {
    setHeaders((h) =>
      h.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    );
  }
  function addQuery() {
    setQueryParams((q) => [...q, { id: uid(), key: "", value: "" }]);
  }
  function removeQuery(id: string) {
    setQueryParams((q) => q.filter((x) => x.id !== id));
  }
  function updateQuery(id: string, field: "key" | "value", value: string) {
    setQueryParams((q) =>
      q.map((x) => (x.id === id ? { ...x, [field]: value } : x)),
    );
  }

  async function execute() {
    if (!connectionId) {
      toast({
        title: "Select a connection",
        description: "Choose a GHL connection before sending a request.",
        variant: "destructive",
      });
      return;
    }
    if (!endpoint.trim()) {
      toast({
        title: "Endpoint required",
        description: "Enter an endpoint path (e.g. /contacts).",
        variant: "destructive",
      });
      return;
    }
    if (!validateBody()) {
      toast({
        title: "Invalid JSON body",
        description: "Fix JSON syntax before sending.",
        variant: "destructive",
      });
      return;
    }

    setExecuting(true);
    try {
      const headerObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key.trim()) headerObj[h.key.trim()] = h.value;
      });
      const queryObj: Record<string, string> = {};
      queryParams.forEach((q) => {
        if (q.key.trim()) queryObj[q.key.trim()] = q.value;
      });

      const res = await fetch("/api/api-explorer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId,
          method,
          endpoint,
          headers: headerObj,
          body: body || undefined,
          queryParams: queryObj,
          saveName: saveName.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data as ExecuteResponse;
        setResponse(data);
        toast({
          title:
            data.statusCode >= 200 && data.statusCode < 300
              ? "Request completed"
              : "Request returned an error",
          description: `HTTP ${data.statusCode} in ${data.durationMs}ms${
            data.simulated ? " (simulated)" : ""
          }`,
          variant:
            data.statusCode >= 200 && data.statusCode < 300
              ? "default"
              : "destructive",
        });
        await loadHistory();
        setSaveName("");
      } else {
        toast({
          title: "Request failed",
          description: json.error ?? "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Network error",
        description: err instanceof Error ? err.message : "Unknown",
        variant: "destructive",
      });
    } finally {
      setExecuting(false);
    }
  }

  function loadFromHistory(item: ApiRequest) {
    if (item.connectionId) setConnectionId(item.connectionId);
    setMethod(item.method);
    setEndpoint(item.endpoint);
    setHeaders(
      Object.entries(item.headers ?? {}).map(([k, v]) => ({
        id: uid(),
        key: k,
        value: v,
      })),
    );
    const qp = item.queryParams ?? {};
    setQueryParams(
      Object.entries(qp).map(([k, v]) => ({ id: uid(), key: k, value: v })),
    );
    setBody(item.body ?? "");
    setBodyError(null);
  }

  async function deleteHistory(item: ApiRequest) {
    try {
      const res = await fetch(`/api/api-explorer/history/${item.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "History entry deleted" });
        await loadHistory();
      } else {
        toast({
          title: "Error",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setDeleteTarget(null);
    }
  }

  const statusClass = (code: number | null | undefined) => {
    if (!code) return "text-muted-foreground";
    if (code >= 200 && code < 300)
      return "text-emerald-600 dark:text-emerald-400";
    if (code >= 400 && code < 500)
      return "text-amber-600 dark:text-amber-400";
    if (code >= 500) return "text-destructive";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="API Explorer"
        description="Build, execute and inspect GHL API requests. Responses are persisted as history."
        icon={<Terminal className="h-5 w-5" />}
      />

      <ResizablePanelGroup
        direction="horizontal"
        className="min-h-[600px] rounded-lg border"
      >
        {/* Request builder */}
        <ResizablePanel defaultSize={55} minSize={35}>
          <div className="flex h-full flex-col gap-4 p-4">
            {/* Connection */}
            <div className="grid gap-2">
              <Label htmlFor="api-conn">Connection</Label>
              {connLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : connections.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No connections available. Add one in the Connections module.
                </p>
              ) : (
                <Select value={connectionId} onValueChange={setConnectionId}>
                  <SelectTrigger id="api-conn" className="w-full">
                    <SelectValue placeholder="Select connection" />
                  </SelectTrigger>
                  <SelectContent>
                    {connections.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{" "}
                        <span className="text-xs text-muted-foreground">
                          ({c.locationId})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Method + endpoint */}
            <div className="grid gap-2">
              <Label>Request</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="flex flex-wrap gap-1">
                  {METHODS.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={cn(
                        "rounded-md border px-3 py-1.5 text-xs font-semibold transition-all",
                        method === m
                          ? METHOD_COLORS[m]
                          : "border-border text-muted-foreground hover:bg-muted",
                      )}
                      aria-pressed={method === m}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/contacts"
                  list="ghl-endpoints"
                  className="flex-1 font-mono text-sm"
                />
                <datalist id="ghl-endpoints">
                  {COMMON_ENDPOINTS.map((e) => (
                    <option key={e} value={e} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Query params */}
            <KvEditor
              label="Query params"
              rows={queryParams}
              onAdd={addQuery}
              onRemove={removeQuery}
              onUpdate={updateQuery}
              placeholderKey="param"
              placeholderValue="value"
            />

            {/* Headers */}
            <KvEditor
              label="Headers"
              rows={headers}
              onAdd={addHeader}
              onRemove={removeHeader}
              onUpdate={updateHeader}
              placeholderKey="Header-Name"
              placeholderValue="value"
            />

            {/* Body */}
            {method !== "GET" && method !== "DELETE" && (
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-body">Request body (JSON)</Label>
                  {bodyError && (
                    <span className="text-xs text-destructive">
                      {bodyError}
                    </span>
                  )}
                </div>
                <Textarea
                  id="api-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  onBlur={validateBody}
                  placeholder='{ "firstName": "Jane", "lastName": "Doe" }'
                  className="font-mono text-xs min-h-[120px]"
                />
              </div>
            )}

            {/* Save name */}
            <div className="grid gap-2">
              <Label htmlFor="save-name">
                Save as{" "}
                <span className="text-xs text-muted-foreground">
                  (optional name)
                </span>
              </Label>
              <Input
                id="save-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="e.g. List contacts"
              />
            </div>

            <div className="mt-auto flex items-center justify-end gap-2">
              <Button
                onClick={execute}
                disabled={executing || !connectionId}
                className="gap-2"
              >
                {executing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Send Request
              </Button>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Response viewer */}
        <ResizablePanel defaultSize={45} minSize={30}>
          <div className="flex h-full flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Response</h3>
              {response && (
                <div className="flex items-center gap-2">
                  {response.simulated && (
                    <Badge variant="outline" className="text-[10px]">
                      Simulated
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {response.durationMs}ms
                  </Badge>
                </div>
              )}
            </div>

            {!response ? (
              <EmptyState
                icon={<Terminal className="h-5 w-5" />}
                title="No response yet"
                description="Send a request to see its status code, headers and body."
              />
            ) : (
              <div className="flex flex-1 flex-col gap-3 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "font-mono text-lg font-bold",
                      statusClass(response.statusCode),
                    )}
                  >
                    {response.statusCode}
                  </span>
                  <Badge
                    variant={
                      response.status === "success" ? "default" : "destructive"
                    }
                    className="text-[10px]"
                  >
                    {response.status}
                  </Badge>
                </div>

                <Collapsible
                  open={headersOpen}
                  onOpenChange={setHeadersOpen}
                  className="rounded-md border"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium">
                    <span>Response headers</span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 transition-transform",
                        headersOpen && "rotate-180",
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t">
                      <JsonView
                        data={response.headers ?? {}}
                        className="max-h-48 overflow-y-auto custom-scroll bg-transparent"
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="flex-1 overflow-hidden">
                  <JsonView
                    data={response.body}
                    className="max-h-full overflow-y-auto custom-scroll bg-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Request history</CardTitle>
            {history.length > 0 && (
              <Button variant="ghost" size="sm" onClick={loadHistory}>
                Refresh
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <EmptyState
              icon={<Terminal className="h-5 w-5" />}
              title="No history yet"
              description="Executed requests will appear here."
            />
          ) : (
            <ul className="max-h-96 space-y-2 overflow-y-auto custom-scroll pr-1">
              {history.map((h) => (
                <li
                  key={h.id}
                  className="group flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2 text-sm hover:border-primary/40"
                >
                  <button
                    onClick={() => loadFromHistory(h)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    aria-label={`Load ${h.method} ${h.endpoint}`}
                  >
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-mono text-[10px]",
                        METHOD_COLORS[h.method].split(" ").slice(0, 2).join(" "),
                      )}
                    >
                      {h.method}
                    </Badge>
                    <span className="truncate font-mono text-xs">
                      {h.endpoint}
                    </span>
                    {h.isSaved && h.savedName && (
                      <Badge variant="secondary" className="text-[10px]">
                        {h.savedName}
                      </Badge>
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    {h.statusCode && (
                      <span
                        className={cn(
                          "font-mono text-xs",
                          statusClass(h.statusCode),
                        )}
                      >
                        {h.statusCode}
                      </span>
                    )}
                    {h.durationMs != null && (
                      <span className="text-[10px] text-muted-foreground">
                        {h.durationMs}ms
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(h.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => setDeleteTarget(h)}
                      aria-label="Delete history entry"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete history entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the saved request from history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && deleteHistory(deleteTarget)}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// Key-value pair editor
// ============================================================
function KvEditor({
  label,
  rows,
  onAdd,
  onRemove,
  onUpdate,
  placeholderKey,
  placeholderValue,
}: {
  label: string;
  rows: KvPair[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: "key" | "value", value: string) => void;
  placeholderKey: string;
  placeholderValue: string;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button variant="ghost" size="sm" onClick={onAdd} className="gap-1 h-7">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">None</p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2">
              <Input
                value={row.key}
                onChange={(e) => onUpdate(row.id, "key", e.target.value)}
                placeholder={placeholderKey}
                className="font-mono text-xs"
              />
              <span className="text-muted-foreground">:</span>
              <Input
                value={row.value}
                onChange={(e) => onUpdate(row.id, "value", e.target.value)}
                placeholder={placeholderValue}
                className="font-mono text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onRemove(row.id)}
                aria-label={`Remove ${label} row`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
