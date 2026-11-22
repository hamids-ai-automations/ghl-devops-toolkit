"use client";

import * as React from "react";
import {
  ChevronDown,
  CircleAlert,
  FlaskConical,
  FolderTree,
  History,
  Loader2,
  Play,
  Plus,
  Trash2,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ModuleHeader,
  EmptyState,
  JsonView,
  StatusBadge,
} from "@/components/module-common";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type {
  Assertion,
  GhlConnection,
  TestCase,
  TestRun,
  TestSuite,
} from "@/lib/types";

type Operator = Assertion["operator"];
const OPERATORS: Operator[] = [
  "equals",
  "exists",
  "not_null",
  "contains",
  "greater_than",
  "less_than",
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

interface AssertionDraft {
  id: string;
  field: string;
  operator: Operator;
  expected: string;
}

interface CaseFormState {
  id?: string;
  name: string;
  description: string;
  suiteId: string;
  method: string;
  endpoint: string;
  body: string;
  inputError: string | null;
  assertions: AssertionDraft[];
  tags: string;
}

const DEFAULT_CASE_FORM: CaseFormState = {
  name: "",
  description: "",
  suiteId: "",
  method: "GET",
  endpoint: "/contacts",
  body: "",
  inputError: null,
  assertions: [
    {
      id: uid(),
      field: "statusCode",
      operator: "equals",
      expected: "200",
    },
  ],
  tags: "",
};

export function TestingModule() {
  const [tab, setTab] = React.useState("cases");
  const [connections, setConnections] = React.useState<GhlConnection[]>([]);

  React.useEffect(() => {
    fetch("/api/connections")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setConnections(j.data as GhlConnection[]);
      });
  }, []);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Automation Testing"
        description="Build test cases & suites, run them against GHL, and review pass/fail history."
        icon={<FlaskConical className="h-5 w-5" />}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="cases" className="gap-1">
            <FlaskConical className="h-3 w-3" /> Test Cases
          </TabsTrigger>
          <TabsTrigger value="suites" className="gap-1">
            <FolderTree className="h-3 w-3" /> Test Suites
          </TabsTrigger>
          <TabsTrigger value="runs" className="gap-1">
            <History className="h-3 w-3" /> Run History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cases" className="mt-6">
          <CasesTab connections={connections} />
        </TabsContent>
        <TabsContent value="suites" className="mt-6">
          <SuitesTab connections={connections} />
        </TabsContent>
        <TabsContent value="runs" className="mt-6">
          <RunsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================
// Test Cases Tab
// ============================================================
function CasesTab({ connections }: { connections: GhlConnection[] }) {
  const [cases, setCases] = React.useState<TestCase[]>([]);
  const [suites, setSuites] = React.useState<TestSuite[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<CaseFormState>(DEFAULT_CASE_FORM);
  const [saving, setSaving] = React.useState(false);
  const [runningId, setRunningId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<TestCase | null>(null);
  const [runResult, setRunResult] = React.useState<RunResult | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [caseRes, suiteRes] = await Promise.all([
        fetch("/api/testing/cases").then((r) => r.json()),
        fetch("/api/testing/suites").then((r) => r.json()),
      ]);
      if (caseRes.success) setCases(caseRes.data as TestCase[]);
      if (suiteRes.success)
        setSuites(
          (suiteRes.data as Array<TestSuite & { caseCount: number }>).map(
            ({ caseCount: _caseCount, ...rest }) => rest,
          ),
        );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setForm({
      ...DEFAULT_CASE_FORM,
      assertions: DEFAULT_CASE_FORM.assertions.map((a) => ({
        ...a,
        id: uid(),
      })),
    });
    setDialogOpen(true);
  }

  function openEdit(tc: TestCase) {
    const input = tc.inputPayload as {
      method?: string;
      endpoint?: string;
      body?: unknown;
    };
    setForm({
      id: tc.id,
      name: tc.name,
      description: tc.description ?? "",
      suiteId: tc.suiteId ?? "",
      method: input.method ?? "GET",
      endpoint: input.endpoint ?? "/contacts",
      body:
        input.body !== undefined && input.body !== null
          ? JSON.stringify(input.body, null, 2)
          : "",
      inputError: null,
      assertions: (tc.assertions ?? []).map((a) => ({
        id: a.id ?? uid(),
        field: a.field,
        operator: a.operator,
        expected: a.expected ?? "",
      })),
      tags: tc.tags ?? "",
    });
    setDialogOpen(true);
  }

  function validateInput(): Record<string, unknown> | null {
    if (form.body.trim()) {
      try {
        const parsed = JSON.parse(form.body);
        return { method: form.method, endpoint: form.endpoint, body: parsed };
      } catch (e) {
        setForm({
          ...form,
          inputError: e instanceof Error ? e.message : "Invalid JSON",
        });
        return null;
      }
    }
    setForm({ ...form, inputError: null });
    return { method: form.method, endpoint: form.endpoint };
  }

  async function handleSave() {
    if (!form.name.trim()) {
      toast({
        title: "Name required",
        variant: "destructive",
      });
      return;
    }
    if (form.assertions.length === 0) {
      toast({
        title: "Add at least one assertion",
        variant: "destructive",
      });
      return;
    }
    const input = validateInput();
    if (!input) {
      toast({
        title: "Invalid JSON body",
        description: "Fix syntax errors before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        suiteId: form.suiteId || undefined,
        inputPayload: input,
        assertions: form.assertions.map(({ id, ...rest }) => ({
          id,
          ...rest,
        })),
        tags: form.tags || undefined,
      };
      // The testing cases API exposes POST (create) and DELETE (delete) but
      // not PATCH. For edits we delete the existing record then POST a new one.
      if (form.id) {
        await fetch(`/api/testing/cases/${form.id}`, { method: "DELETE" });
      }
      const res = await fetch("/api/testing/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: form.id ? "Test case updated" : "Test case created",
          description: form.name,
        });
        setDialogOpen(false);
        await load();
      } else {
        toast({
          title: "Save failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleRun(tc: TestCase) {
    setRunningId(tc.id);
    setRunResult(null);
    try {
      const res = await fetch("/api/testing/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: tc.id }),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data as RunResult;
        setRunResult(data);
        toast({
          title:
            data.status === "passed" ? "Tests passed" : "Tests failed",
          description: `${data.assertionsPassed}/${data.assertionsRun} assertions passed`,
          variant: data.status === "passed" ? "default" : "destructive",
        });
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

  async function handleDelete(tc: TestCase) {
    try {
      const res = await fetch(`/api/testing/cases/${tc.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Test case deleted" });
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

  function addAssertion() {
    setForm({
      ...form,
      assertions: [
        ...form.assertions,
        { id: uid(), field: "", operator: "equals", expected: "" },
      ],
    });
  }
  function removeAssertion(id: string) {
    setForm({
      ...form,
      assertions: form.assertions.filter((a) => a.id !== id),
    });
  }
  function updateAssertion(
    id: string,
    field: keyof AssertionDraft,
    value: string,
  ) {
    setForm({
      ...form,
      assertions: form.assertions.map((a) =>
        a.id === id ? { ...a, [field]: value } : a,
      ),
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> New Case
        </Button>
      </div>

      {runResult && (
        <RunSummaryCard result={runResult} onClose={() => setRunResult(null)} />
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon={<FlaskConical className="h-8 w-8" />}
          title="No test cases yet"
          description="Create your first assertion-based test case."
          action={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> New Case
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {cases.map((tc) => (
            <Card key={tc.id} className="py-3">
              <CardContent className="flex flex-col gap-3 px-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{tc.name}</p>
                    {tc.tags &&
                      tc.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                        .map((t) => (
                          <Badge
                            key={t}
                            variant="outline"
                            className="text-[10px]"
                          >
                            {t}
                          </Badge>
                        ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">
                      {tc.assertions?.length ?? 0} assertions
                    </Badge>
                    {(tc.inputPayload as { method?: string })?.method && (
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {(tc.inputPayload as { method?: string }).method}
                      </Badge>
                    )}
                    {(tc.inputPayload as { endpoint?: string })?.endpoint && (
                      <span className="truncate font-mono">
                        {(tc.inputPayload as { endpoint?: string }).endpoint}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRun(tc)}
                    disabled={runningId === tc.id}
                    className="gap-1"
                  >
                    {runningId === tc.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    Run
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(tc)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeleteTarget(tc)}
                    aria-label="Delete case"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Case dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "Edit test case" : "New test case"}
            </DialogTitle>
            <DialogDescription>
              Define an API call and assertions to validate the response.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 overflow-y-auto custom-scroll max-h-[65vh] pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tc-name">Name</Label>
                <Input
                  id="tc-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="List contacts returns 200"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tc-suite">Suite (optional)</Label>
                <Select
                  value={form.suiteId}
                  onValueChange={(v) =>
                    setForm({ ...form, suiteId: v === "__none" ? "" : v })
                  }
                >
                  <SelectTrigger id="tc-suite" className="w-full">
                    <SelectValue placeholder="No suite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">No suite</SelectItem>
                    {suites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tc-desc">Description</Label>
              <Textarea
                id="tc-desc"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="What does this case verify?"
                className="text-sm min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div className="grid gap-2">
                <Label htmlFor="tc-method">Method</Label>
                <Select
                  value={form.method}
                  onValueChange={(v) =>
                    setForm({ ...form, method: v })
                  }
                >
                  <SelectTrigger id="tc-method" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tc-endpoint">Endpoint</Label>
                <Input
                  id="tc-endpoint"
                  value={form.endpoint}
                  onChange={(e) =>
                    setForm({ ...form, endpoint: e.target.value })
                  }
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tc-body">Body (JSON)</Label>
                {form.inputError && (
                  <span className="text-xs text-destructive">
                    {form.inputError}
                  </span>
                )}
              </div>
              <Textarea
                id="tc-body"
                value={form.body}
                onChange={(e) =>
                  setForm({ ...form, body: e.target.value, inputError: null })
                }
                placeholder='{ "firstName": "Jane" }'
                className="font-mono text-xs min-h-[100px]"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Assertions</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={addAssertion}
                  className="h-7 gap-1"
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {form.assertions.map((a) => (
                  <div
                    key={a.id}
                    className="grid grid-cols-[1fr_140px_1fr_auto] items-center gap-2"
                  >
                    <Input
                      value={a.field}
                      onChange={(e) =>
                        updateAssertion(a.id, "field", e.target.value)
                      }
                      placeholder="statusCode or body.id"
                      className="font-mono text-xs"
                    />
                    <Select
                      value={a.operator}
                      onValueChange={(v) =>
                        updateAssertion(a.id, "operator", v as Operator)
                      }
                    >
                      <SelectTrigger className="w-full text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={a.expected}
                      onChange={(e) =>
                        updateAssertion(a.id, "expected", e.target.value)
                      }
                      placeholder="expected"
                      className="font-mono text-xs"
                      disabled={
                        a.operator === "exists" || a.operator === "not_null"
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeAssertion(a.id)}
                      aria-label="Remove assertion"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                {form.assertions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Add at least one assertion.
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tc-tags">
                Tags{" "}
                <span className="text-xs text-muted-foreground">
                  (comma separated)
                </span>
              </Label>
              <Input
                id="tc-tags"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="contacts, regression"
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
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.id ? "Update case" : "Create case"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete test case?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes <strong>{deleteTarget?.name}</strong> permanently.
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

// ============================================================
// Test Suites Tab
// ============================================================
function SuitesTab({ connections }: { connections: GhlConnection[] }) {
  const [suites, setSuites] = React.useState<
    Array<TestSuite & { caseCount: number }>
  >([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<
    (TestSuite & { caseCount: number }) | null
  >(null);
  const [selectedSuite, setSelectedSuite] = React.useState<
    (TestSuite & { caseCount: number }) | null
  >(null);
  const [suiteCases, setSuiteCases] = React.useState<TestCase[]>([]);
  const [casesLoading, setCasesLoading] = React.useState(false);
  const [runningSuite, setRunningSuite] = React.useState(false);
  const [runResult, setRunResult] = React.useState<RunResult | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/testing/suites");
      const json = await res.json();
      if (json.success)
        setSuites(json.data as Array<TestSuite & { caseCount: number }>);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function loadSuiteCases(suiteId: string) {
    setCasesLoading(true);
    try {
      const res = await fetch(`/api/testing/cases?suiteId=${suiteId}`);
      const json = await res.json();
      if (json.success) setSuiteCases(json.data as TestCase[]);
    } finally {
      setCasesLoading(false);
    }
  }

  function openSuite(suite: TestSuite & { caseCount: number }) {
    setSelectedSuite(suite);
    setRunResult(null);
    loadSuiteCases(suite.id);
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/testing/suites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || undefined }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Suite created", description: name });
        setDialogOpen(false);
        setName("");
        setDescription("");
        await load();
      } else {
        toast({
          title: "Failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(suite: TestSuite & { caseCount: number }) {
    try {
      const res = await fetch(`/api/testing/suites/${suite.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Suite deleted" });
        if (selectedSuite?.id === suite.id) setSelectedSuite(null);
        await load();
      }
    } finally {
      setDeleteTarget(null);
    }
  }

  async function handleRunSuite() {
    if (!selectedSuite) return;
    setRunningSuite(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/testing/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suiteId: selectedSuite.id }),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data as RunResult;
        setRunResult(data);
        toast({
          title: data.status === "passed" ? "Suite passed" : "Suite failed",
          description: `${data.assertionsPassed}/${data.assertionsRun} assertions passed`,
          variant: data.status === "passed" ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Run failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setRunningSuite(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Suite
        </Button>
      </div>

      {runResult && (
        <RunSummaryCard result={runResult} onClose={() => setRunResult(null)} />
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : suites.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-8 w-8" />}
          title="No suites yet"
          description="Group related test cases into a suite to run them together."
          action={
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" /> New Suite
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
          <div className="space-y-2">
            {suites.map((s) => (
              <Card
                key={s.id}
                className={cn(
                  "cursor-pointer py-3 transition-all hover:border-primary/40",
                  selectedSuite?.id === s.id && "border-primary",
                )}
              >
                <CardContent
                  className="flex items-center justify-between px-4"
                  onClick={() => openSuite(s)}
                >
                  <div className="min-w-0 space-y-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.caseCount} case{s.caseCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(s);
                    }}
                    aria-label="Delete suite"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {selectedSuite ? selectedSuite.name : "Select a suite"}
                </CardTitle>
                {selectedSuite && (
                  <Button
                    size="sm"
                    onClick={handleRunSuite}
                    disabled={runningSuite || selectedSuite.caseCount === 0}
                    className="gap-1"
                  >
                    {runningSuite ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    Run Suite
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!selectedSuite ? (
                <p className="text-sm text-muted-foreground">
                  Pick a suite on the left to view its test cases.
                </p>
              ) : casesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : suiteCases.length === 0 ? (
                <EmptyState
                  icon={<FlaskConical className="h-5 w-5" />}
                  title="No cases in this suite"
                  description="Assign test cases to this suite from the Cases tab."
                />
              ) : (
                <ul className="max-h-72 space-y-2 overflow-y-auto custom-scroll pr-1">
                  {suiteCases.map((tc) => (
                    <li
                      key={tc.id}
                      className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{tc.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tc.assertions?.length ?? 0} assertions
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {(tc.inputPayload as { method?: string })?.method ?? "GET"}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New test suite</DialogTitle>
            <DialogDescription>
              Group related test cases together.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="suite-name">Name</Label>
              <Input
                id="suite-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contacts regression"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="suite-desc">Description</Label>
              <Textarea
                id="suite-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-sm"
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
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete suite?</AlertDialogTitle>
            <AlertDialogDescription>
              Suite <strong>{deleteTarget?.name}</strong> will be removed. Its
              cases will be unlinked but kept.
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

// ============================================================
// Run History Tab
// ============================================================
function RunsTab() {
  const [runs, setRuns] = React.useState<TestRun[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/testing/run");
      const json = await res.json();
      if (json.success) setRuns(json.data as TestRun[]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <EmptyState
          icon={<History className="h-8 w-8" />}
          title="No runs yet"
          description="Run a test case or suite to see results here."
        />
      ) : (
        <div className="space-y-2">
          {runs.map((run) => (
            <Collapsible key={run.id}>
              <Card className="py-3">
                <CardContent className="px-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <StatusBadge status={run.status} />
                      <p className="truncate font-medium">{run.name}</p>
                      {run.simulated && (
                        <Badge variant="outline" className="text-[10px]">
                          Simulated
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {run.assertionsPassed}/{run.assertionsRun} assertions
                      </span>
                      {run.durationMs != null && <span>{run.durationMs}ms</span>}
                      <span>
                        {formatDistanceToNow(new Date(run.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      {run.failures && run.failures.length > 0 && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 gap-1">
                            <CircleAlert className="h-3 w-3 text-destructive" />
                            {run.failures.length} failure
                            {run.failures.length === 1 ? "" : "s"}
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>
                  </div>
                  <CollapsibleContent>
                    <ul className="mt-3 space-y-2 border-t pt-3">
                      {run.failures?.map((f, i) => (
                        <li
                          key={i}
                          className="rounded-md border bg-destructive/5 p-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{f.field}</span>
                            <Badge
                              variant="destructive"
                              className="text-[10px]"
                            >
                              failed
                            </Badge>
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {f.message}
                          </p>
                          <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-[11px]">
                            <span>
                              expected:{" "}
                              <span className="text-emerald-600 dark:text-emerald-400">
                                {f.expected}
                              </span>
                            </span>
                            <span>
                              actual:{" "}
                              <span className="text-destructive">{f.actual}</span>
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CollapsibleContent>
                </CardContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Run summary card
// ============================================================
interface RunCase {
  runId: string;
  caseId: string;
  name: string;
  status: "passed" | "failed" | "skipped" | "error";
  assertionsRun: number;
  assertionsPassed: number;
  failures?: Array<{
    field: string;
    expected: string;
    actual: string;
    message: string;
  }>;
  durationMs?: number;
  simulated: boolean;
}

interface RunResult {
  runId: string;
  status: "passed" | "failed" | "skipped" | "error";
  assertionsRun: number;
  assertionsPassed: number;
  cases: RunCase[];
  simulated: boolean;
}

function RunSummaryCard({
  result,
  onClose,
}: {
  result: RunResult;
  onClose: () => void;
}) {
  const passed = result.cases.filter((c) => c.status === "passed").length;
  const failed = result.cases.filter((c) => c.status === "failed").length;
  return (
    <Card
      className={cn(
        "border-l-4",
        result.status === "passed"
          ? "border-l-emerald-500"
          : "border-l-destructive",
      )}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <StatusBadge status={result.status} />
            Run summary
            {result.simulated && (
              <Badge variant="outline" className="text-[10px]">
                Simulated
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Cases" value={result.cases.length} />
          <Stat
            label="Passed"
            value={passed}
            tone="text-emerald-600 dark:text-emerald-400"
          />
          <Stat
            label="Failed"
            value={failed}
            tone="text-destructive"
          />
          <Stat
            label="Assertions"
            value={`${result.assertionsPassed}/${result.assertionsRun}`}
          />
        </div>
        <ul className="space-y-2">
          {result.cases.map((c) => (
            <li
              key={c.runId}
              className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <StatusBadge status={c.status} />
                <span className="truncate font-medium">{c.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {c.assertionsPassed}/{c.assertionsRun}
                {c.durationMs != null ? ` · ${c.durationMs}ms` : ""}
              </span>
            </li>
          ))}
        </ul>
        {result.cases.some((c) => c.failures && c.failures.length > 0) && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground">
              Failures
            </h4>
            <JsonView data={result.cases.flatMap((c) => c.failures ?? [])} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: string;
}) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={cn("text-lg font-bold", tone)}>{value}</div>
    </div>
  );
}
