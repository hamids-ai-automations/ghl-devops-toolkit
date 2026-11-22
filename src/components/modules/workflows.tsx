"use client";

import * as React from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  MinusCircle,
  Pencil,
  Play,
  Plus,
  Trash2,
  Workflow,
  XCircle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ModuleHeader,
  EmptyState,
  JsonView,
  StatusBadge,
} from "@/components/module-common";
import { toast } from "@/hooks/use-toast";
import type {
  GhlConnection,
  WorkflowScenario,
  WorkflowSim,
  WorkflowStep,
} from "@/lib/types";

type StepType = WorkflowStep["type"];
type StepStatus = NonNullable<WorkflowStep["status"]>;

const SCENARIOS: WorkflowScenario[] = [
  "new_lead",
  "contact_updated",
  "pipeline_stage_changed",
  "appointment_booked",
  "appointment_cancelled",
  "form_submitted",
  "follow_up_triggered",
];

interface StepDraft {
  id: string;
  name: string;
  type: StepType;
  description: string;
}

interface SimFormState {
  name: string;
  scenario: WorkflowScenario;
  contactPayload: string;
  steps: StepDraft[];
  notes: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// Pre-built scenario templates
function templateFor(scenario: WorkflowScenario): {
  payload: Record<string, unknown>;
  steps: Array<Omit<StepDraft, "id">>;
} {
  const contact = {
    contact_id: "c_" + Math.random().toString(36).slice(2, 8),
    location_id: "DEMO_LOCATION",
    first_name: "Jane",
    last_name: "Doe",
    email: "jane.doe@example.com",
    phone: "+15551234567",
  };
  switch (scenario) {
    case "new_lead":
      return {
        payload: { ...contact, source: "web-form", tags: ["new-lead"] },
        steps: [
          { name: "Webhook received", type: "trigger", description: "LeadCreated event received" },
          { name: "Tag new-lead", type: "action", description: "Apply tag new-lead to contact" },
          { name: "Send welcome SMS", type: "notification", description: "Trigger SMS template welcome" },
          { name: "Create opportunity", type: "action", description: "Create opportunity in pipeline New Leads" },
          { name: "Wait 1 hour", type: "wait", description: "Pause for 1 hour before follow-up" },
          { name: "Send follow-up email", type: "notification", description: "Email template first-touch" },
        ],
      };
    case "contact_updated":
      return {
        payload: { ...contact, updated_fields: ["email", "phone"] },
        steps: [
          { name: "Webhook received", type: "trigger", description: "ContactUpdated event received" },
          { name: "Validate phone", type: "condition", description: "Check phone is E.164 formatted" },
          { name: "Sync to CRM", type: "action", description: "Push updated contact to external CRM" },
          { name: "Update opportunity", type: "action", description: "Update linked opportunity record" },
        ],
      };
    case "pipeline_stage_changed":
      return {
        payload: { ...contact, pipeline_id: "pipe_1", previous_stage: "New", new_stage: "Qualified" },
        steps: [
          { name: "Webhook received", type: "trigger", description: "PipelineStageChanged event" },
          { name: "Update stage", type: "action", description: "Move opportunity to Qualified stage" },
          { name: "Notify owner", type: "notification", description: "Notify opportunity owner via email" },
          { name: "Start sequence", type: "action", description: "Enrol contact in Qualified sequence" },
        ],
      };
    case "appointment_booked":
      return {
        payload: { ...contact, appointment_id: "appt_1", start_time: new Date().toISOString() },
        steps: [
          { name: "Webhook received", type: "trigger", description: "AppointmentCreated event" },
          { name: "Create calendar event", type: "action", description: "Persist to GHL calendar" },
          { name: "Send confirmation SMS", type: "notification", description: "SMS template appt-confirm" },
          { name: "Send confirmation email", type: "notification", description: "Email template appt-confirm" },
          { name: "Schedule reminder", type: "wait", description: "Schedule 24h reminder" },
        ],
      };
    case "appointment_cancelled":
      return {
        payload: { ...contact, appointment_id: "appt_1", cancelled_reason: "no-show" },
        steps: [
          { name: "Webhook received", type: "trigger", description: "AppointmentCancelled event" },
          { name: "Cancel calendar event", type: "action", description: "Mark calendar event cancelled" },
          { name: "Send cancellation SMS", type: "notification", description: "SMS template appt-cancel" },
          { name: "Tag as no-show", type: "action", description: "Apply tag no-show to contact" },
          { name: "Schedule follow-up", type: "wait", description: "Wait 24h then re-engage" },
        ],
      };
    case "form_submitted":
      return {
        payload: { ...contact, form_id: "form_1", submission_id: "sub_1" },
        steps: [
          { name: "Webhook received", type: "trigger", description: "FormSubmitted event" },
          { name: "Parse fields", type: "action", description: "Map form answers to custom fields" },
          { name: "Create contact", type: "action", description: "Upsert contact in GHL" },
          { name: "Send thank-you email", type: "notification", description: "Email template form-thanks" },
        ],
      };
    case "follow_up_triggered":
      return {
        payload: { ...contact, sequence_id: "seq_1", step: 2 },
        steps: [
          { name: "Timer fired", type: "trigger", description: "Follow-up schedule elapsed" },
          { name: "Check last response", type: "condition", description: "If no reply in 3 days" },
          { name: "Send SMS nudge", type: "notification", description: "SMS template nudge" },
          { name: "Wait 2 days", type: "wait", description: "Pause for 2 days" },
          { name: "Send final email", type: "notification", description: "Email template last-touch" },
        ],
      };
  }
}

const DEFAULT_FORM: SimFormState = {
  name: "",
  scenario: "new_lead",
  contactPayload: JSON.stringify(
    templateFor("new_lead").payload,
    null,
    2,
  ),
  steps: templateFor("new_lead").steps.map((s) => ({ ...s, id: uid() })),
  notes: "",
};

const STEP_TYPE_COLORS: Record<StepType, string> = {
  trigger: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  action: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  wait: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  condition: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  notification: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
};

const STATUS_ICON: Record<StepStatus, React.ReactNode> = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
  skipped: <MinusCircle className="h-4 w-4 text-muted-foreground" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
};

export function WorkflowsModule() {
  const [sims, setSims] = React.useState<WorkflowSim[]>([]);
  const [connections, setConnections] = React.useState<GhlConnection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<SimFormState>(DEFAULT_FORM);
  const [saving, setSaving] = React.useState(false);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<WorkflowSim | null>(null);
  const [viewTarget, setViewTarget] = React.useState<WorkflowSim | null>(null);
  const [payloadError, setPayloadError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [simRes, connRes] = await Promise.all([
        fetch("/api/workflows").then((r) => r.json()),
        fetch("/api/connections").then((r) => r.json()),
      ]);
      if (simRes.success) setSims(simRes.data as WorkflowSim[]);
      if (connRes.success) setConnections(connRes.data as GhlConnection[]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function applyScenario(scenario: WorkflowScenario) {
    const tpl = templateFor(scenario);
    setForm({
      ...form,
      scenario,
      contactPayload: JSON.stringify(tpl.payload, null, 2),
      steps: tpl.steps.map((s) => ({ ...s, id: uid() })),
    });
    setPayloadError(null);
  }

  function validatePayload() {
    try {
      JSON.parse(form.contactPayload);
      setPayloadError(null);
      return true;
    } catch (e) {
      setPayloadError(e instanceof Error ? e.message : "Invalid JSON");
      return false;
    }
  }

  function addStep() {
    setForm({
      ...form,
      steps: [
        ...form.steps,
        { id: uid(), name: "New step", type: "action", description: "" },
      ],
    });
  }
  function removeStep(id: string) {
    setForm({ ...form, steps: form.steps.filter((s) => s.id !== id) });
  }
  function updateStep(id: string, field: keyof StepDraft, value: string) {
    setForm({
      ...form,
      steps: form.steps.map((s) =>
        s.id === id ? { ...s, [field]: value } : s,
      ),
    });
  }
  function moveStep(id: string, dir: -1 | 1) {
    const idx = form.steps.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= form.steps.length) return;
    const next = [...form.steps];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setForm({ ...form, steps: next });
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      toast({
        title: "Name required",
        description: "Give the simulation a name.",
        variant: "destructive",
      });
      return;
    }
    if (!validatePayload()) {
      toast({
        title: "Invalid JSON payload",
        description: "Fix syntax errors before saving.",
        variant: "destructive",
      });
      return;
    }
    if (form.steps.length === 0) {
      toast({
        title: "No steps",
        description: "Add at least one workflow step.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          scenario: form.scenario,
          contactPayload: JSON.parse(form.contactPayload),
          expectedSteps: form.steps.map(({ id, ...rest }) => ({ id, ...rest })),
          notes: form.notes || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Simulation created", description: form.name });
        setDialogOpen(false);
        await load();
      } else {
        toast({
          title: "Failed to create",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRun(sim: WorkflowSim, connId?: string) {
    setRunningId(sim.id);
    try {
      const res = await fetch(`/api/workflows/run/${sim.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId: connId }),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data as {
          result: string;
          durationMs: number;
          executedSteps: WorkflowStep[];
          simulated: boolean;
        };
        toast({
          title: `Run ${data.result}`,
          description: `${data.executedSteps.length} steps executed in ${data.durationMs}ms`,
          variant: data.result === "passed" ? "default" : "destructive",
        });
        await load();
        // Open view to show executed steps
        const updated = (await fetch("/api/workflows").then((r) =>
          r.json(),
        )).data as WorkflowSim[];
        const me = updated.find((s) => s.id === sim.id);
        if (me) setViewTarget(me);
      } else {
        toast({
          title: "Run failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setRunningId(null);
    }
  }

  async function handleDelete(sim: WorkflowSim) {
    try {
      const res = await fetch(`/api/workflows/${sim.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Simulation deleted", description: sim.name });
        await load();
      } else {
        toast({
          title: "Delete failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setDeleteTarget(null);
    }
  }

  function openCreate() {
    setForm({
      ...DEFAULT_FORM,
      steps: DEFAULT_FORM.steps.map((s) => ({ ...s, id: uid() })),
      contactPayload: JSON.stringify(
        templateFor("new_lead").payload,
        null,
        2,
      ),
    });
    setPayloadError(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Workflow Simulator"
        description="Build lead journey scenarios and step through them locally. All runs are simulated — no real GHL writes occur."
        icon={<Workflow className="h-5 w-5" />}
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> New Simulation
          </Button>
        }
      />

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Simulated environment</AlertTitle>
        <AlertDescription>
          Workflow runs do not call your real GHL account. Each step is
          executed against the GHL client in simulate mode unless a connection
          with status <strong>active</strong> is selected.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : sims.length === 0 ? (
        <EmptyState
          icon={<Workflow className="h-8 w-8" />}
          title="No simulations yet"
          description="Create your first workflow simulation to step through a lead journey."
          action={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> New Simulation
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sims.map((sim) => (
            <Card key={sim.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate text-base">
                      {sim.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Updated{" "}
                      {formatDistanceToNow(new Date(sim.updatedAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <StatusBadge status={sim.status} />
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="text-[10px]">
                    {sim.scenario.replace(/_/g, " ")}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {sim.expectedSteps?.length ?? 0} steps
                  </Badge>
                </div>
                {sim.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {sim.notes}
                  </p>
                )}
              </CardContent>
              <CardFooter className="gap-2 border-t pt-4">
                <Button
                  size="sm"
                  onClick={() => handleRun(sim)}
                  disabled={runningId === sim.id}
                  className="gap-1"
                >
                  {runningId === sim.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  Run
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewTarget(sim)}
                  className="gap-1"
                >
                  View
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteTarget(sim)}
                  className="ml-auto gap-1 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>New workflow simulation</DialogTitle>
            <DialogDescription>
              Pick a scenario to auto-fill a starter template, then customize.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 overflow-y-auto custom-scroll max-h-[65vh] pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="wf-name">Name</Label>
                <Input
                  id="wf-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="New lead welcome flow"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="wf-scenario">Scenario</Label>
                <Select
                  value={form.scenario}
                  onValueChange={(v) =>
                    applyScenario(v as WorkflowScenario)
                  }
                >
                  <SelectTrigger id="wf-scenario" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCENARIOS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="wf-payload">Contact payload (JSON)</Label>
                {payloadError && (
                  <span className="text-xs text-destructive">
                    {payloadError}
                  </span>
                )}
              </div>
              <Textarea
                id="wf-payload"
                value={form.contactPayload}
                onChange={(e) =>
                  setForm({ ...form, contactPayload: e.target.value })
                }
                onBlur={validatePayload}
                className="font-mono text-xs min-h-[140px]"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Expected steps</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addStep}
                  className="h-7 gap-1"
                >
                  <Plus className="h-3 w-3" /> Add step
                </Button>
              </div>
              <div className="space-y-2">
                {form.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className="rounded-md border bg-muted/20 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={STEP_TYPE_COLORS[step.type]}
                      >
                        {step.type}
                      </Badge>
                      <Input
                        value={step.name}
                        onChange={(e) =>
                          updateStep(step.id, "name", e.target.value)
                        }
                        placeholder="Step name"
                        className="h-8 text-sm"
                      />
                      <Select
                        value={step.type}
                        onValueChange={(v) =>
                          updateStep(step.id, "type", v as StepType)
                        }
                      >
                        <SelectTrigger className="h-8 w-32 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            [
                              "trigger",
                              "action",
                              "wait",
                              "condition",
                              "notification",
                            ] as StepType[]
                          ).map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveStep(step.id, -1)}
                          disabled={idx === 0}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => moveStep(step.id, 1)}
                          disabled={idx === form.steps.length - 1}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeStep(step.id)}
                          aria-label="Remove step"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <Input
                      value={step.description}
                      onChange={(e) =>
                        updateStep(step.id, "description", e.target.value)
                      }
                      placeholder="Description"
                      className="mt-2 h-8 text-xs text-muted-foreground"
                    />
                  </div>
                ))}
                {form.steps.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No steps yet. Click &ldquo;Add step&rdquo;.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="wf-notes">
                Notes{" "}
                <span className="text-xs text-muted-foreground">
                  (hint: include &ldquo;timeout&rdquo; to simulate an SMS
                  failure)
                </span>
              </Label>
              <Textarea
                id="wf-notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Optional notes for this simulation"
                className="text-sm min-h-[60px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Create simulation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View dialog */}
      <Dialog open={!!viewTarget} onOpenChange={(o) => !o && setViewTarget(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              {viewTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Scenario{" "}
              <span className="font-mono">{viewTarget?.scenario}</span> &middot;{" "}
              {viewTarget?.executedSteps?.length
                ? "Last run results below"
                : "Not yet run"}
            </DialogDescription>
          </DialogHeader>
          {viewTarget && (
            <div className="space-y-4 overflow-y-auto custom-scroll max-h-[65vh] pr-1">
              <div className="flex items-center gap-2">
                <StatusBadge status={viewTarget.status} />
                {viewTarget.executedSteps && (
                  <Badge variant="outline" className="text-[10px]">
                    Simulated run
                  </Badge>
                )}
              </div>

              {viewTarget.executedSteps && viewTarget.executedSteps.length > 0 ? (
                <Alert className="border-amber-500/30 bg-amber-500/5">
                  <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle>Simulated results</AlertTitle>
                  <AlertDescription>
                    These step outcomes were produced by the toolkit&rsquo;s
                    GHL client in simulate mode. No real GHL actions were
                    performed.
                  </AlertDescription>
                </Alert>
              ) : null}

              <ol className="space-y-2">
                {(viewTarget.executedSteps ?? viewTarget.expectedSteps ?? []).map(
                  (step, idx) => (
                    <li
                      key={step.id ?? idx}
                      className="flex items-start gap-3 rounded-md border bg-card p-3"
                    >
                      <div className="mt-0.5">
                        {step.status
                          ? STATUS_ICON[step.status]
                          : <Clock className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={STEP_TYPE_COLORS[step.type]}
                          >
                            {step.type}
                          </Badge>
                          <span className="text-sm font-medium">
                            {step.name}
                          </span>
                        </div>
                        {step.description && (
                          <p className="text-xs text-muted-foreground">
                            {step.description}
                          </p>
                        )}
                        {step.result && (
                          <p className="font-mono text-xs text-muted-foreground">
                            {step.result}
                          </p>
                        )}
                      </div>
                    </li>
                  ),
                )}
              </ol>

              <div className="grid gap-2">
                <h4 className="text-xs font-semibold text-muted-foreground">
                  Contact payload
                </h4>
                <JsonView data={viewTarget.contactPayload} />
              </div>

              {connections.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Run with connection:
                  </span>
                  {connections.map((c) => (
                    <Button
                      key={c.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleRun(viewTarget, c.id)}
                      disabled={runningId === viewTarget.id}
                      className="gap-1"
                    >
                      {runningId === viewTarget.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Calendar className="h-3 w-3" />
                      )}
                      {c.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete simulation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{deleteTarget?.name}</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
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
