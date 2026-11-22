"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ModuleHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function ModuleHeader({ title, description, icon, actions }: ModuleHeaderProps) {
  return (
    <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        )}
        <div className="space-y-0.5">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-2xl">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface JsonViewProps {
  data: unknown;
  className?: string;
}

export function JsonView({ data, className }: JsonViewProps) {
  const text = React.useMemo(() => {
    try {
      return typeof data === "string" ? JSON.stringify(JSON.parse(data), null, 2) : JSON.stringify(data, null, 2);
    } catch {
      return typeof data === "string" ? data : String(data);
    }
  }, [data]);

  return <pre className={cn("json-viewer rounded-md bg-muted/40 p-3 text-foreground/90", className)}>{text}</pre>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    success: "default",
    passed: "default",
    active: "default",
    valid: "default",
    pending: "secondary",
    draft: "secondary",
    partial: "secondary",
    warnings: "secondary",
    failed: "destructive",
    error: "destructive",
    invalid: "destructive",
    expired: "destructive",
    demo: "outline",
    skipped: "outline",
  };
  const variant = map[status] ?? "outline";
  return (
    <Badge variant={variant} className="text-[10px] capitalize">
      {status}
    </Badge>
  );
}
