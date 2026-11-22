"use client";

import * as React from "react";
import {
  BadgeCheck,
  CircleAlert,
  Info,
  KeyRound,
  Loader2,
  Pencil,
  Plug,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  StatusBadge,
} from "@/components/module-common";
import { toast } from "@/hooks/use-toast";
import type { AuthType, GhlConnection } from "@/lib/types";

interface FormState {
  id?: string;
  name: string;
  locationId: string;
  authType: AuthType;
  accessToken: string;
  apiVersion: string;
  scopes: string;
}

const DEFAULT_FORM: FormState = {
  name: "",
  locationId: "",
  authType: "private_token",
  accessToken: "",
  apiVersion: "2021-07-07",
  scopes: "",
};

export function ConnectionsModule() {
  const [connections, setConnections] = React.useState<GhlConnection[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<FormState>(DEFAULT_FORM);
  const [verifyingId, setVerifyingId] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<GhlConnection | null>(null);
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/connections");
      const json = await res.json();
      if (json.success) {
        setConnections(json.data as GhlConnection[]);
      } else {
        toast({
          title: "Error",
          description: json.error ?? "Failed to load connections",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(DEFAULT_FORM);
    setDialogOpen(true);
  }

  function openEdit(conn: GhlConnection) {
    setEditing({
      id: conn.id,
      name: conn.name,
      locationId: conn.locationId,
      authType: conn.authType,
      accessToken: "",
      apiVersion: conn.apiVersion,
      scopes: conn.scopes ?? "",
    });
    setDialogOpen(true);
  }

  async function handleSubmit() {
    if (!editing.name || !editing.locationId || !editing.accessToken) {
      toast({
        title: "Missing fields",
        description: "Name, location ID and access token are required.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: editing.name,
        locationId: editing.locationId,
        authType: editing.authType,
        accessToken: editing.accessToken,
        apiVersion: editing.apiVersion,
        scopes: editing.scopes.trim() || undefined,
      };
      const url = editing.id
        ? `/api/connections/${editing.id}`
        : "/api/connections";
      const method = editing.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: editing.id ? "Connection updated" : "Connection created",
          description: editing.name,
        });
        setDialogOpen(false);
        await load();
      } else {
        toast({
          title: "Error",
          description: json.error ?? "Failed to save connection",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify(conn: GhlConnection) {
    setVerifyingId(conn.id);
    try {
      const res = await fetch(`/api/connections/${conn.id}/verify`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data as {
          status: string;
          statusCode: number;
          responseTimeMs: number;
          simulated: boolean;
        };
        toast({
          title: data.status === "active" ? "Connection verified" : "Verification failed",
          description: `HTTP ${data.statusCode} in ${data.responseTimeMs}ms${
            data.simulated ? " (simulated)" : ""
          }`,
          variant: data.status === "active" ? "default" : "destructive",
        });
        await load();
      } else {
        toast({
          title: "Verification failed",
          description: json.error ?? "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setVerifyingId(null);
    }
  }

  async function handleDelete(conn: GhlConnection) {
    try {
      const res = await fetch(`/api/connections/${conn.id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Connection deleted", description: conn.name });
        await load();
      } else {
        toast({
          title: "Error",
          description: json.error ?? "Failed to delete",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Network error",
        variant: "destructive",
      });
    } finally {
      setDeleteTarget(null);
    }
  }

  const scopeList = (s?: string | null) =>
    (s ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="GHL Connections"
        description="Manage GoHighLevel API integrations and verify tokens."
        icon={<Plug className="h-5 w-5" />}
        actions={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" /> Add Connection
          </Button>
        }
      />

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>OAuth vs Private Integration tokens</AlertTitle>
        <AlertDescription>
          Use <strong>Private Token</strong> for server-to-server access
          (location-level API key from GHL Marketplace &rarr; Private
          Integration). Use <strong>OAuth</strong> for apps installed via the
          GHL App Marketplace. Tokens are stored locally and never sent to any
          third party.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-56 w-full" />
          ))}
        </div>
      ) : connections.length === 0 ? (
        <EmptyState
          icon={<Plug className="h-8 w-8" />}
          title="No connections yet"
          description="Add your first GHL connection to start exploring the API."
          action={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Add Connection
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {connections.map((conn) => {
            const scopes = scopeList(conn.scopes);
            return (
              <Card key={conn.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="truncate text-base">
                        {conn.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">
                        Location:{" "}
                        <span className="font-mono">{conn.locationId}</span>
                      </p>
                    </div>
                    <StatusBadge status={conn.status} />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <Badge variant="secondary" className="capitalize">
                      {conn.authType === "oauth" ? (
                        <BadgeCheck className="h-3 w-3" />
                      ) : (
                        <KeyRound className="h-3 w-3" />
                      )}
                      {conn.authType === "oauth"
                        ? "OAuth"
                        : "Private Token"}
                    </Badge>
                    <Badge variant="outline" className="font-mono">
                      v{conn.apiVersion}
                    </Badge>
                  </div>
                  {scopes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {scopes.map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="text-[10px] text-muted-foreground"
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {conn.lastVerifiedAt ? (
                      <>
                        <BadgeCheck className="h-3 w-3" />
                        Verified{" "}
                        {formatDistanceToNow(new Date(conn.lastVerifiedAt), {
                          addSuffix: true,
                        })}
                      </>
                    ) : (
                      <>
                        <CircleAlert className="h-3 w-3" /> Not verified yet
                      </>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVerify(conn)}
                    disabled={verifyingId === conn.id}
                    className="gap-1"
                  >
                    {verifyingId === conn.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Verify
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(conn)}
                    className="gap-1"
                    aria-label={`Edit ${conn.name}`}
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTarget(conn)}
                    className="ml-auto gap-1 text-destructive hover:text-destructive"
                    aria-label={`Delete ${conn.name}`}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing.id ? "Edit connection" : "Add GHL connection"}
            </DialogTitle>
            <DialogDescription>
              Provide a name, the location ID and an access token. Tokens are
              stored locally in SQLite.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="conn-name">Name</Label>
              <Input
                id="conn-name"
                value={editing.name}
                onChange={(e) =>
                  setEditing({ ...editing, name: e.target.value })
                }
                placeholder="My GHL Location"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conn-location">Location ID</Label>
              <Input
                id="conn-location"
                value={editing.locationId}
                onChange={(e) =>
                  setEditing({ ...editing, locationId: e.target.value })
                }
                placeholder="GHL location id"
                className="font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="conn-auth">Auth type</Label>
                <Select
                  value={editing.authType}
                  onValueChange={(v) =>
                    setEditing({ ...editing, authType: v as AuthType })
                  }
                >
                  <SelectTrigger id="conn-auth" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private_token">
                      Private Token
                    </SelectItem>
                    <SelectItem value="oauth">OAuth</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="conn-version">API Version</Label>
                <Input
                  id="conn-version"
                  value={editing.apiVersion}
                  onChange={(e) =>
                    setEditing({ ...editing, apiVersion: e.target.value })
                  }
                  placeholder="2021-07-07"
                  className="font-mono text-xs"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conn-token">
                Access Token{" "}
                {editing.id && (
                  <span className="text-xs text-muted-foreground">
                    (leave blank to keep current)
                  </span>
                )}
              </Label>
              <Input
                id="conn-token"
                type="password"
                value={editing.accessToken}
                onChange={(e) =>
                  setEditing({ ...editing, accessToken: e.target.value })
                }
                placeholder="pit-... or OAuth bearer token"
                className="font-mono text-xs"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conn-scopes">
                Scopes{" "}
                <span className="text-xs text-muted-foreground">
                  (comma separated)
                </span>
              </Label>
              <Input
                id="conn-scopes"
                value={editing.scopes}
                onChange={(e) =>
                  setEditing({ ...editing, scopes: e.target.value })
                }
                placeholder="contacts.read, contacts.write"
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
            <Button onClick={handleSubmit} disabled={saving} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing.id ? "Save changes" : "Create connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <strong>{deleteTarget?.name}</strong>. This action cannot be
              undone.
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
