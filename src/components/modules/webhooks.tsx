"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Clipboard,
  Eye,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Search,
  Send,
  Webhook,
  XCircle,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ModuleHeader, EmptyState, JsonView } from "@/components/module-common";
import { toast } from "@/hooks/use-toast";
import type { WebhookEvent } from "@/lib/types";

const EVENT_TYPES = [
  "LeadCreated",
  "ContactUpdated",
  "ContactDeleted",
  "AppointmentCreated",
  "AppointmentUpdated",
  "AppointmentCancelled",
  "FormSubmitted",
  "PipelineStageChanged",
  "TaskCompleted",
  "NoteAdded",
  "TagAdded",
  "InboundCall",
  "OutboundCall",
  "SmsSent",
  "EmailSent",
];

const DEFAULT_PAYLOAD = {
  contact_id: "abc123",
  location_id: "DEMO_LOCATION",
  first_name: "Jane",
  last_name: "Doe",
  email: "jane.doe@example.com",
  phone: "+15551234567",
  tags: ["new-lead"],
  source: "web-form",
};

function randomSlug() {
  return (
    "whk-" +
    Math.random().toString(36).slice(2, 8) +
    Math.random().toString(36).slice(2, 6)
  );
}

export function WebhooksModule() {
  const [events, setEvents] = React.useState<WebhookEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [origin, setOrigin] = React.useState("");

  const [injectOpen, setInjectOpen] = React.useState(false);
  const [eventType, setEventType] = React.useState("LeadCreated");
  const [payload, setPayload] = React.useState(
    JSON.stringify(DEFAULT_PAYLOAD, null, 2),
  );
  const [payloadError, setPayloadError] = React.useState<string | null>(null);
  const [injecting, setInjecting] = React.useState(false);

  const [viewTarget, setViewTarget] = React.useState<WebhookEvent | null>(null);
  const [replayingId, setReplayingId] = React.useState<string | null>(null);

  // Set up slug + origin on mount
  React.useEffect(() => {
    setSlug(randomSlug());
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  const captureUrl = `${origin}/api/webhooks/capture/${slug}`;

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = filter
        ? `/api/webhooks?eventType=${encodeURIComponent(filter)}`
        : "/api/webhooks";
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setEvents(json.data as WebhookEvent[]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  React.useEffect(() => {
    load();
  }, [load]);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(captureUrl);
      toast({ title: "Copied", description: "Webhook URL copied to clipboard" });
    } catch {
      toast({
        title: "Could not copy",
        description: "Copy this URL manually.",
        variant: "destructive",
      });
    }
  }

  function validatePayload() {
    try {
      JSON.parse(payload);
      setPayloadError(null);
      return true;
    } catch (e) {
      setPayloadError(e instanceof Error ? e.message : "Invalid JSON");
      return false;
    }
  }

  async function handleInject() {
    if (!validatePayload()) {
      toast({
        title: "Invalid JSON payload",
        description: "Fix syntax errors before sending.",
        variant: "destructive",
      });
      return;
    }
    setInjecting(true);
    try {
      const parsed = JSON.parse(payload);
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          payload: parsed,
          endpoint: `capture/${slug}`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Test event injected",
          description: `${eventType} event captured.`,
        });
        setInjectOpen(false);
        await load();
      } else {
        toast({
          title: "Failed to inject",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setInjecting(false);
    }
  }

  async function handleReplay(ev: WebhookEvent) {
    setReplayingId(ev.id);
    try {
      const res = await fetch(`/api/webhooks/replay/${ev.id}`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Event replayed",
          description: "A new event entry was created from this one.",
        });
        await load();
      } else {
        toast({
          title: "Replay failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setReplayingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Webhook Inspector"
        description="Capture GHL webhook events, inspect payloads, and replay them locally."
        icon={<Webhook className="h-5 w-5" />}
        actions={
          <Button onClick={() => setInjectOpen(true)} className="gap-2">
            <Send className="h-4 w-4" /> Send Test Event
          </Button>
        }
      />

      {/* Capture URL card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Webhook Capture URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Configure GoHighLevel to POST events to this URL. Each captured
            event is stored locally and shown below.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label htmlFor="whk-slug" className="sr-only">
              Slug
            </Label>
            <Input
              id="whk-slug"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value.replace(/[^a-zA-Z0-9-_]/g, "").toLowerCase(),
                )
              }
              className="font-mono text-xs sm:w-48"
              placeholder="your-slug"
            />
            <Input
              readOnly
              value={captureUrl}
              className="flex-1 font-mono text-xs"
              aria-label="Webhook capture URL"
            />
            <Button variant="outline" onClick={copyUrl} className="gap-2">
              <Clipboard className="h-4 w-4" /> Copy
            </Button>
            <Button variant="ghost" onClick={() => setSlug(randomSlug())}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by event type..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      {/* Events table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">
              Captured events{" "}
              <span className="text-muted-foreground">({events.length})</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <EmptyState
              icon={<Webhook className="h-6 w-6" />}
              title="No webhook events captured"
              description="Send a test event or point GHL to your capture URL."
              action={
                <Button onClick={() => setInjectOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Send Test Event
                </Button>
              }
            />
          ) : (
            <div className="max-h-96 overflow-y-auto custom-scroll pr-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event type</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead>Source IP</TableHead>
                    <TableHead>Signature</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((ev) => (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {ev.eventType}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {ev.endpoint}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {ev.sourceIp ?? "-"}
                      </TableCell>
                      <TableCell>
                        {ev.signatureValid === true ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" /> Valid
                          </span>
                        ) : ev.signatureValid === false ? (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="h-3 w-3" /> Invalid
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            None
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ev.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewTarget(ev)}
                            className="gap-1"
                          >
                            <Eye className="h-3 w-3" /> View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReplay(ev)}
                            disabled={replayingId === ev.id}
                            className="gap-1"
                          >
                            {replayingId === ev.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3" />
                            )}
                            Replay
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inject dialog */}
      <Dialog open={injectOpen} onOpenChange={setInjectOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Send test webhook event</DialogTitle>
            <DialogDescription>
              Inject a synthetic event into your local capture store.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ev-type">Event type</Label>
              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger id="ev-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="ev-payload">Payload (JSON)</Label>
                {payloadError && (
                  <span className="text-xs text-destructive">
                    {payloadError}
                  </span>
                )}
              </div>
              <Textarea
                id="ev-payload"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                onBlur={validatePayload}
                className="font-mono text-xs min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInjectOpen(false)}
              disabled={injecting}
            >
              Cancel
            </Button>
            <Button onClick={handleInject} disabled={injecting} className="gap-2">
              {injecting && <Loader2 className="h-4 w-4 animate-spin" />}
              Send event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-4 w-4" />
              {viewTarget?.eventType}
            </DialogTitle>
            <DialogDescription className="font-mono text-xs">
              {viewTarget?.endpoint} &middot;{" "}
              {viewTarget
                ? formatDistanceToNow(new Date(viewTarget.createdAt), {
                    addSuffix: true,
                  })
                : ""}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4 overflow-y-auto custom-scroll max-h-[60vh] pr-1">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Source IP" value={viewTarget.sourceIp ?? "-"} />
                <Field
                  label="Signature valid"
                  value={
                    viewTarget.signatureValid === true
                      ? "Yes"
                      : viewTarget.signatureValid === false
                        ? "No"
                        : "None"
                  }
                />
                <Field
                  label="Signature"
                  value={viewTarget.signature ?? "-"}
                  mono
                />
                <Field
                  label="Replay count"
                  value={String(viewTarget.replayCount)}
                />
              </div>
              <div className="grid gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Headers
                </h4>
                <JsonView data={viewTarget.headers ?? {}} />
              </div>
              <div className="grid gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Parsed body
                </h4>
                <JsonView data={viewTarget.parsedBody ?? viewTarget.body} />
              </div>
              <div className="grid gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Raw body
                </h4>
                <pre className="json-viewer rounded-md bg-muted/40 p-3 text-xs">
                  {viewTarget.body}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={
          "text-xs " +
          (mono ? "font-mono break-all" : "truncate")
        }
      >
        {value}
      </div>
    </div>
  );
}
